<?php

namespace App\Models;

use Database\Factories\Form1bSubmissionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'case_id',
    'date_identified',
    'date_registered',
    'date_reopened',
    'caseworker_id',
    'agency',
    'identification_source',
    'identification_source_sector',
    'identification_source_other',
    'first_name',
    'middle_name',
    'last_name',
    'other_names',
    'dob',
    'age',
    'age_estimated',
    'sex',
    'birth_registration',
    'has_id',
    'id_type',
    'id_number',
    'nationality_status',
    'displacement_status',
    'displacement_status_other',
    'nationality',
    'disability_status',
    'disability_other',
    'marital_status',
    'ethnic_affiliation',
    'religion',
    'languages_spoken',
    'care_type',
    'care_type_other',
    'care_description',
    'current_address',
    'area_type',
    'contact_method',
    'caregiver_first_name',
    'caregiver_middle_name',
    'caregiver_last_name',
    'caregiver_dob',
    'caregiver_age',
    'caregiver_age_estimated',
    'caregiver_sex',
    'caregiver_has_id',
    'caregiver_id_type',
    'caregiver_id_number',
    'caregiver_nationality_status',
    'caregiver_displacement_status',
    'caregiver_has_disabilities',
    'caregiver_disabilities_detail',
    'caregiver_related_to_child',
    'caregiver_relationship',
    'caregiver_knows_family',
    'care_arrangement_start',
    'caregiver_willing_to_continue',
    'caregiver_unwilling_reason',
    'caregiver_is_legal_guardian',
    'caregiver_contact',
    'household_adults',
    'household_children',
    'main_caregiver_under_18',
    'situation_description',
    'risks_identified',
    'justice_system_status',
    'mother_first_name',
    'mother_middle_name',
    'mother_last_name',
    'mother_alive',
    'mother_death_note',
    'mother_nationality_status',
    'mother_displacement_status',
    'mother_has_disabilities',
    'mother_disabilities_detail',
    'mother_in_contact',
    'mother_contact_method',
    'mother_dob',
    'mother_age',
    'mother_age_estimated',
    'mother_has_id',
    'mother_id_type',
    'mother_id_number',
    'father_first_name',
    'father_middle_name',
    'father_last_name',
    'father_alive',
    'father_death_note',
    'father_nationality_status',
    'father_displacement_status',
    'father_has_disabilities',
    'father_disabilities_detail',
    'father_in_contact',
    'father_contact_method',
    'father_dob',
    'father_age',
    'father_age_estimated',
    'father_has_id',
    'father_id_type',
    'father_id_number',
    'has_urgent_needs',
    'needs_family_tracing',
    'risk_level',
    'risk_summary',
    'caseworker_name',
    'caseworker_date',
    'caseworker_signature',
])]
class Form1bSubmission extends Model
{
    /** @use HasFactory<Form1bSubmissionFactory> */
    use HasFactory;

    protected $table = 'form_1b_submissions';

    protected function casts(): array
    {
        return [
            'date_identified' => 'date',
            'date_registered' => 'date',
            'date_reopened' => 'date',
            'dob' => 'date',
            'caregiver_dob' => 'date',
            'care_arrangement_start' => 'date',
            'caseworker_date' => 'date',
            'mother_dob' => 'date',
            'father_dob' => 'date',
            'age_estimated' => 'boolean',
            'has_id' => 'boolean',
            'caregiver_age_estimated' => 'boolean',
            'caregiver_has_id' => 'boolean',
            'caregiver_has_disabilities' => 'boolean',
            'caregiver_related_to_child' => 'boolean',
            'caregiver_knows_family' => 'boolean',
            'caregiver_willing_to_continue' => 'boolean',
            'caregiver_is_legal_guardian' => 'boolean',
            'main_caregiver_under_18' => 'boolean',
            'mother_has_disabilities' => 'boolean',
            'mother_in_contact' => 'boolean',
            'mother_age_estimated' => 'boolean',
            'mother_has_id' => 'boolean',
            'father_has_disabilities' => 'boolean',
            'father_in_contact' => 'boolean',
            'father_age_estimated' => 'boolean',
            'father_has_id' => 'boolean',
            'has_urgent_needs' => 'boolean',
            'needs_family_tracing' => 'boolean',
            'languages_spoken' => 'array',
            'risks_identified' => 'array',
        ];
    }

    public function childCase(): BelongsTo
    {
        return $this->belongsTo(ChildCase::class, 'case_id');
    }

    public function householdMembers(): HasMany
    {
        return $this->hasMany(Form1bHouseholdMember::class, 'form_1b_submission_id');
    }

    public function familyMembers(): HasMany
    {
        return $this->hasMany(Form1bFamilyMember::class, 'form_1b_submission_id');
    }

    public function immediateNeeds(): HasMany
    {
        return $this->hasMany(Form1bImmediateNeed::class, 'form_1b_submission_id');
    }
}
