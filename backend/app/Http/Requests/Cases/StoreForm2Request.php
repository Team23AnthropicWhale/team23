<?php

namespace App\Http\Requests\Cases;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreForm2Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Case information
            'date_started' => ['required', 'date'],
            'date_completed' => ['nullable', 'date'],
            'contact_type' => ['required', Rule::in(['home_visit', 'meeting_other_location', 'phone_call', 'other'])],
            'who_present' => ['required', 'array', 'min:1'],
            'who_present.*' => [Rule::in(['child', 'parent_caregiver', 'other'])],
            'who_present_other' => ['nullable', 'string', 'max:255'],
            'is_reopened' => ['required', 'boolean'],
            'previous_closure_date' => [Rule::when($this->boolean('is_reopened'), ['required']), 'nullable', 'date'],

            // Assessment of current situation
            'safety' => ['required', 'string'],
            'family_caregiving' => ['required', 'string'],
            'physical_health' => ['required', 'string'],
            'emotional_wellbeing' => ['required', 'string'],
            'education_status' => ['required', Rule::in(['no_learning', 'formal_education', 'other_learning'])],
            'education_detail' => ['nullable', 'string'],
            'friends_social' => ['required', 'string'],
            'work' => ['required', 'string'],
            'legal_documentation' => ['required', 'string'],

            // Incident details (all optional and sensitive)
            'perpetrator_known' => ['nullable', 'boolean'],
            'perpetrator_type' => ['nullable', Rule::in(['family_member', 'intimate_partner', 'peer', 'formal_authority', 'employer', 'un_ngo_staff', 'armed_force', 'other'])],
            'perpetrator_other' => ['nullable', 'string', 'max:255'],
            'incident_location_known' => ['nullable', 'boolean'],
            'incident_location' => ['nullable', Rule::in(['inside_home', 'outside_home', 'education_vocational', 'medical_facilities', 'residential_care', 'workplace', 'detention', 'digital', 'other'])],
            'incident_location_other' => ['nullable', 'string', 'max:255'],

            // Views of the child
            'child_views_wishes' => ['required', 'string'],
            'child_seen_individually' => ['required', 'boolean'],
            'caregiver_views_wishes' => ['required', 'string'],

            // Analysis
            'risk_factors' => ['required', 'string'],
            'protective_factors' => ['required', 'string'],
            'additional_notes' => ['nullable', 'string'],
            'bid_required' => ['required', 'boolean'],

            // Authorization — caseworker
            'caseworker_name' => ['required', 'string', 'max:255'],
            'caseworker_date' => ['required', 'date'],
            'caseworker_signature' => ['required', 'string'],

            // Authorization — supervisor
            'supervisor_name' => ['required', 'string', 'max:255'],
            'supervisor_date' => ['required', 'date'],
            'supervisor_signature' => ['required', 'string'],
            'supervisor_comments' => ['nullable', 'string'],
        ];
    }
}
