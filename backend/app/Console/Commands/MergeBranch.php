<?php

namespace App\Console\Commands;

use App\Models\Branch;
use App\Models\BranchGalleryItem;
use App\Models\BranchService;
use App\Models\BranchTeamMember;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MergeBranch extends Command
{
    protected $signature   = 'branch:merge {from : Branch ID to delete} {into : Branch ID to keep}';
    protected $description = 'Move all data from one branch into another, then delete the source branch.';

    public function handle(): int
    {
        $fromId = (int) $this->argument('from');
        $intoId = (int) $this->argument('into');

        $from = Branch::find($fromId);
        $into = Branch::find($intoId);

        if (!$from || !$into) {
            $this->error("Branch not found. from={$fromId} into={$intoId}");
            return 1;
        }

        $this->info("Merging: [{$from->id}] {$from->name}  →  [{$into->id}] {$into->name}");

        if (!$this->confirm('Continue? This will delete the source branch and all its manager accounts.')) {
            return 0;
        }

        DB::transaction(function () use ($fromId, $intoId, $from) {
            $counts = [];

            $counts['leads']        = Lead::where('branch_id', $fromId)->update(['branch_id' => $intoId]);
            $counts['gallery']      = BranchGalleryItem::where('branch_id', $fromId)->update(['branch_id' => $intoId]);
            $counts['services']     = BranchService::where('branch_id', $fromId)->update(['branch_id' => $intoId]);
            $counts['team_members'] = BranchTeamMember::where('branch_id', $fromId)->update(['branch_id' => $intoId]);

            // Re-assign non-manager users (students/agencies linked to this branch)
            $counts['users'] = User::where('branch_id', $fromId)
                ->where('gateway_type', '!=', 'branch')
                ->update(['branch_id' => $intoId]);

            // Delete manager accounts for the old branch
            $managers = User::where('branch_id', $fromId)->where('gateway_type', 'branch')->get();
            foreach ($managers as $manager) {
                $manager->tokens()->delete();
                $manager->delete();
            }
            $counts['managers_deleted'] = $managers->count();

            $from->delete();

            foreach ($counts as $table => $n) {
                $this->line("  {$table}: {$n} records updated");
            }
            $this->info("  managers deleted: {$counts['managers_deleted']}");
            $this->info("  branch [{$fromId}] deleted.");
        });

        $this->info('Done.');
        return 0;
    }
}
