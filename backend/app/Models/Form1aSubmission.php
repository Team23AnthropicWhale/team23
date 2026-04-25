<?php

namespace App\Models;

use Database\Factories\Form1aSubmissionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'case_id',
    'date_completed',
    'first_name',
    'middle_name',
    'last_name',
    'other_names',
    'legal_basis',
    'vital_interests_override',
    'consent_from',
    'consent_other_relationship',
    'assent_from',
    'assent_other_relationship',
    'permission_participation',
    'permission_data_collection',
    'permission_data_sharing',
    'permission_reporting',
    'permission_tracing',
    'has_withheld_info',
    'withheld_info_detail',
    'withheld_info_reason',
    'child_name_auth',
    'child_date_auth',
    'child_signature',
    'caregiver_name_auth',
    'caregiver_date_auth',
    'caregiver_signature',
    'caseworker_name_auth',
    'caseworker_date_auth',
    'caseworker_signature',
    'supervisor_name_auth',
    'supervisor_date_auth',
    'supervisor_signature',
])]
class Form1aSubmission extends Model
{
    /** @use HasFactory<Form1aSubmissionFactory> */
    use HasFactory;

    protected $table = 'form_1a_submissions';

    protected function casts(): array
    {
        return [
            'date_completed' => 'date',
            'child_date_auth' => 'date',
            'caregiver_date_auth' => 'date',
            'caseworker_date_auth' => 'date',
            'supervisor_date_auth' => 'date',
            'vital_interests_override' => 'boolean',
            'permission_participation' => 'boolean',
            'permission_data_collection' => 'boolean',
            'permission_data_sharing' => 'boolean',
            'permission_reporting' => 'boolean',
            'permission_tracing' => 'boolean',
            'has_withheld_info' => 'boolean',
            'consent_from' => 'array',
            'assent_from' => 'array',
        ];
    }

    public function childCase(): BelongsTo
    {
        return $this->belongsTo(ChildCase::class, 'case_id');
    }
}
