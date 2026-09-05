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
        'customer_name', 'customer_phone', 'customer_email',
        'received_by', 'notes',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    protected $appends = ['due_amount'];

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
}
