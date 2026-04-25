<?php

namespace App\Models;

use Database\Factories\Form2SubmissionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'case_id',
    'date_started',
    'date_completed',
    'contact_type',
    'who_present',
    'who_present_other',
    'is_reopened',
    'previous_closure_date',
    'safety',
    'family_caregiving',
    'physical_health',
    'emotional_wellbeing',
    'education_status',
    'education_detail',
    'friends_social',
    'work',
    'legal_documentation',
    'perpetrator_known',
    'perpetrator_type',
    'perpetrator_other',
    'incident_location_known',
    'incident_location',
    'incident_location_other',
    'child_views_wishes',
    'child_seen_individually',
    'caregiver_views_wishes',
    'risk_factors',
    'protective_factors',
    'additional_notes',
    'bid_required',
    'caseworker_name',
    'caseworker_date',
    'caseworker_signature',
    'supervisor_name',
    'supervisor_date',
    'supervisor_signature',
    'supervisor_comments',
])]
class Form2Submission extends Model
{
    /** @use HasFactory<Form2SubmissionFactory> */
    use HasFactory;

    protected $table = 'form_2_submissions';

    protected function casts(): array
    {
        return [
            'date_started' => 'date',
            'date_completed' => 'date',
            'previous_closure_date' => 'date',
            'caseworker_date' => 'date',
            'supervisor_date' => 'date',
            'is_reopened' => 'boolean',
            'perpetrator_known' => 'boolean',
            'incident_location_known' => 'boolean',
            'child_seen_individually' => 'boolean',
            'bid_required' => 'boolean',
            'who_present' => 'array',
        ];
    }

    public function childCase(): BelongsTo
    {
        return $this->belongsTo(ChildCase::class, 'case_id');
    }
}
