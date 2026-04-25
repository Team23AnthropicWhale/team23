<?php

namespace App\Models;

use Database\Factories\Form1bImmediateNeedFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['form_1b_submission_id', 'category', 'category_other', 'summary_reasons', 'action_taken'])]
class Form1bImmediateNeed extends Model
{
    /** @use HasFactory<Form1bImmediateNeedFactory> */
    use HasFactory;

    protected $table = 'form_1b_immediate_needs';

    public function form1bSubmission(): BelongsTo
    {
        return $this->belongsTo(Form1bSubmission::class, 'form_1b_submission_id');
    }
}
