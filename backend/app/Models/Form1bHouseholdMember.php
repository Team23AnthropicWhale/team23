<?php

namespace App\Models;

use Database\Factories\Form1bHouseholdMemberFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['form_1b_submission_id', 'full_name', 'age', 'relationship'])]
class Form1bHouseholdMember extends Model
{
    /** @use HasFactory<Form1bHouseholdMemberFactory> */
    use HasFactory;

    protected $table = 'form_1b_household_members';

    public function form1bSubmission(): BelongsTo
    {
        return $this->belongsTo(Form1bSubmission::class, 'form_1b_submission_id');
    }
}
