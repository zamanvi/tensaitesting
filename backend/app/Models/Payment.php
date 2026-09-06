<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id', 'form_template_id', 'branch_id', 'payment_category_id', 'fund_target',
        'amount', 'total_amount', 'status', 'currency', 'method',
        'customer_name', 'customer_phone', 'customer_email', 'student_roll',
        'received_by', 'notes',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    protected $appends = ['due_amount', 'ho_settlement', 'refunded_amount', 'net_amount'];

    protected static function booted(): void
    {
        static::creating(function (Payment $payment) {
            $payment->receipt_no = 'RCPT-' . date('Y') . '-' . strtoupper(Str::random(8));

            // total_amount defaults to amount and vice versa — whichever side
            // was left blank is assumed to mean "same as the other", i.e. paid
            // in full. Both blank is invalid and caught by form validation
            // upstream, not here.
            if (blank($payment->total_amount)) {
                $payment->total_amount = $payment->amount;
            }
            if (blank($payment->amount)) {
                $payment->amount = $payment->total_amount;
            }

            $payment->status = $payment->computeStatus();
        });

        // The memo's creation is itself collection #1 — needs the row to
        // already have an id, so this runs after insert, not in creating().
        static::created(function (Payment $payment) {
            if ((float) $payment->amount > 0) {
                $payment->collections()->create([
                    'amount'      => $payment->amount,
                    'received_by' => $payment->received_by,
                ]);
            }
        });
    }

    public function collections(): HasMany
    {
        return $this->hasMany(PaymentCollection::class)->latest();
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class)->latest();
    }

    /** Only an approved refund actually reduces anything — a pending/rejected
     *  one hasn't moved money yet. Uses the loaded relation when available
     *  (eager-loaded on the admin/branch listings) instead of re-querying. */
    public function getRefundedAmountAttribute(): string
    {
        $sum = $this->relationLoaded('refunds')
            ? $this->refunds->where('status', 'approved')->sum('amount')
            : $this->refunds()->approved()->sum('amount');

        return number_format((float) $sum, 2, '.', '');
    }

    /** The one open refund request waiting on Admin's decision, if any — a
     *  memo only ever has at most one pending request at a time (enforced in
     *  the request-refund endpoint, not here). */
    public function pendingRefund(): ?Refund
    {
        return $this->relationLoaded('refunds')
            ? $this->refunds->firstWhere('status', 'pending')
            : $this->refunds()->pending()->first();
    }

    /** What's actually still retained from this memo after approved refunds —
     *  this, not the raw `amount`, is what every balance/settlement/student-
     *  total calculation should sum. The memo's own `amount` column never
     *  changes (immutable ledger); a refund is always a separate record. */
    public function getNetAmountAttribute(): string
    {
        $net = (float) $this->amount - (float) $this->refunded_amount;
        return number_format(max($net, 0), 2, '.', '');
    }

    /**
     * Derives paid/partial/due from amount vs total_amount. Called explicitly
     * (rather than kept as a live accessor) because `status` is a real column —
     * it needs to be queryable/filterable in the admin table, same as
     * Commission::status.
     */
    public function computeStatus(): string
    {
        $total = (float) $this->total_amount;
        $paid  = (float) $this->amount;

        if ($total <= 0 || $paid >= $total) return 'paid';
        if ($paid > 0)                      return 'partial';
        return 'due';
    }

    public function getDueAmountAttribute(): string
    {
        $due = (float) $this->total_amount - (float) $this->amount;
        return number_format(max($due, 0), 2, '.', '');
    }

    /** Records an additional collection against a due/partial memo. Clamped
     *  so a mistyped amount can never push `amount` past `total_amount` —
     *  that would make this memo's fund contribution exceed what was ever
     *  actually invoiced. Logs the actually-applied amount (post-clamp) as
     *  its own PaymentCollection row — the memo's own `amount` stays the
     *  running total, this is the per-installment history. */
    public function collect(float $amountToAdd, ?int $receivedBy = null): void
    {
        $before  = (float) $this->amount;
        $this->amount = min(
            round($before + $amountToAdd, 2),
            (float) $this->total_amount
        );
        $applied = round($this->amount - $before, 2);

        $this->status = $this->computeStatus();
        $this->save();

        if ($applied > 0) {
            $this->collections()->create([
                'amount'      => $applied,
                'received_by' => $receivedBy,
            ]);
        }
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    /** Which published service this memo is for — set from Admin's Create
     *  Memo when there's no real Application yet to link via application(). */
    public function formTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(PaymentCategory::class, 'payment_category_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeFundedHeadOffice($query)
    {
        return $query->where('fund_target', 'head_office');
    }

    /** Roll numbers are only unique within a branch — the same roll at two
     *  different branches is two different people — so a student's memos are
     *  always looked up by this (branch, roll) pair together, never roll alone. */
    public function scopeForStudentRoll($query, ?int $branchId, string $roll)
    {
        return $query->where('branch_id', $branchId)->where('student_roll', $roll);
    }

    /** Everything one student has ever paid, across every category and every
     *  memo, regardless of whether each one was Course Fee, Processing Fee,
     *  Service Charge, etc. — the whole point of tagging memos with a roll.
     *  total_paid is net of approved refunds; total_refunded is broken out
     *  separately so a refund doesn't just silently vanish from the view. */
    public static function ledgerForStudent(?int $branchId, string $roll): array
    {
        $memos = static::forStudentRoll($branchId, $roll)
            ->with(['category:id,label', 'refunds' => fn ($q) => $q->approved()])
            ->oldest()
            ->get();

        $totalRefunded = $memos->sum(fn (Payment $m) => (float) $m->refunded_amount);

        return [
            'total_paid'     => round((float) $memos->sum('amount') - $totalRefunded, 2),
            'total_invoiced' => round((float) $memos->sum('total_amount'), 2),
            'total_refunded' => round($totalRefunded, 2),
            'memo_count'     => $memos->count(),
            'memos'          => $memos,
        ];
    }

    /**
     * Per-memo Head Office settlement, so "which money has HO actually
     * received" is visible memo-by-memo, not just as one blended total.
     *
     * There's no direct FK from a FundTransfer to the memo(s) it covers — a
     * branch just reports "I sent X" in bulk. So settlement is inferred by
     * FIFO: a branch's head_office memos are settled oldest-first, up to
     * however much of that branch's transfers HO has marked Received. A memo
     * with branch_id null was collected by Head Office itself directly
     * (the "Main Branch" virtual option) — nothing to forward, always settled.
     *
     * Cached per-request (per branch) since a table render calls this once
     * per row; without it every row would re-run the same two queries.
     */
    protected static array $settledIdsCache = [];

    public static function settledIdsForBranch(?int $branchId): array
    {
        if ($branchId === null) {
            return [-1]; // sentinel; isHeadOfficeSettled() special-cases null branches instead of consulting this list
        }

        if (isset(self::$settledIdsCache[$branchId])) {
            return self::$settledIdsCache[$branchId];
        }

        $received = (float) FundTransfer::where('branch_id', $branchId)
            ->where('status', 'received')
            ->sum('amount');

        $settled  = [];
        $remaining = $received;

        static::where('branch_id', $branchId)
            ->where('fund_target', 'head_office')
            ->with(['refunds' => fn ($q) => $q->approved()])
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['id', 'amount', 'branch_id'])
            ->each(function (Payment $memo) use (&$remaining, &$settled) {
                // A fully-refunded memo owes HO nothing — settled trivially,
                // doesn't consume any of the branch's actual received total.
                $net = (float) $memo->net_amount;
                if ($net <= 0) {
                    $settled[] = $memo->id;
                    return;
                }
                if ($remaining >= $net) {
                    $settled[] = $memo->id;
                    $remaining -= $net;
                }
            });

        return self::$settledIdsCache[$branchId] = $settled;
    }

    public function isHeadOfficeSettled(): bool
    {
        if ($this->fund_target !== 'head_office') {
            return false; // not applicable — branch-fund memos never need HO settlement
        }
        if ($this->branch_id === null) {
            return true; // collected directly by Head Office, nothing to forward
        }
        return in_array($this->id, self::settledIdsForBranch($this->branch_id), true);
    }

    /** null for a Branch Fund memo (not applicable), else 'settled'/'pending' —
     *  same value the admin table's HO Settlement badge shows, appended here
     *  so the branch dashboard can show the identical per-memo status. */
    public function getHoSettlementAttribute(): ?string
    {
        if ($this->fund_target !== 'head_office') {
            return null;
        }
        if ((float) $this->net_amount <= 0 && (float) $this->refunded_amount > 0) {
            return 'refunded'; // nothing left owed — fully refunded, not "settled"
        }
        return $this->isHeadOfficeSettled() ? 'settled' : 'pending';
    }

    /** All head_office-fund memo IDs, across every branch, not yet covered by
     *  that branch's received transfers — powers the admin "Not Yet Settled"
     *  filter. Branch count is small, so one query pass per branch is fine. */
    public static function pendingHeadOfficeSettlementIds(): array
    {
        $branchIds = static::query()
            ->where('fund_target', 'head_office')
            ->whereNotNull('branch_id')
            ->distinct()
            ->pluck('branch_id');

        $pending = [];
        foreach ($branchIds as $branchId) {
            $settled = self::settledIdsForBranch($branchId);
            static::where('branch_id', $branchId)
                ->where('fund_target', 'head_office')
                ->pluck('id')
                ->each(function ($id) use ($settled, &$pending) {
                    if (!in_array($id, $settled, true)) {
                        $pending[] = $id;
                    }
                });
        }

        return $pending;
    }
}
