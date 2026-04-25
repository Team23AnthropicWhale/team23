<?php

namespace App\Models;

use Database\Factories\Form1bFamilyMemberFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['form_1b_submission_id', 'full_name', 'age', 'relationship', 'address'])]
class Form1bFamilyMember extends Model
{
    /** @use HasFactory<Form1bFamilyMemberFactory> */
    use HasFactory;

    protected $table = 'form_1b_family_members';

    public function form1bSubmission(): BelongsTo
    {
        return $this->belongsTo(Form1bSubmission::class, 'form_1b_submission_id');
    }
}
