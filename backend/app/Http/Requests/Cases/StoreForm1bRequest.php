<?php

namespace App\Http\Requests\Cases;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreForm1bRequest extends FormRequest
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
            'date_identified' => ['required', 'date'],
            'date_registered' => ['required', 'date'],
            'date_reopened' => ['nullable', 'date'],
            'caseworker_id' => ['required', 'string', 'max:255'],
            'agency' => ['required', 'string', 'max:255'],
            'identification_source' => ['required', Rule::in(['self_referral', 'family_member', 'community_member', 'media', 'other_service_provider', 'un_ingo_ngo'])],
            'identification_source_sector' => ['nullable', Rule::in(['education', 'food_security', 'health', 'livelihoods', 'nutrition', 'protection', 'child_protection', 'gbv', 'shelter', 'camp_coordination', 'wash', 'other'])],
            'identification_source_other' => ['nullable', 'string', 'max:255'],

            // Child personal details
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'other_names' => ['nullable', 'string', 'max:255'],
            'dob' => ['required', 'date'],
            'age' => ['required', 'integer', 'min:0', 'max:120'],
            'age_estimated' => ['required', 'boolean'],
            'sex' => ['required', Rule::in(['male', 'female', 'non_binary', 'other'])],
            'birth_registration' => ['required', Rule::in(['registered', 'not_registered', 'in_progress'])],
            'has_id' => ['required', 'boolean'],
            'id_type' => ['nullable', 'string', 'max:255'],
            'id_number' => ['nullable', 'string', 'max:255'],
            'nationality_status' => ['required', Rule::in(['national', 'other_nationality', 'stateless', 'unknown'])],
            'displacement_status' => ['required', Rule::in(['host_community', 'asylum_seeker_refugee', 'idp', 'returnee', 'migrant', 'other'])],
            'displacement_status_other' => ['nullable', 'string', 'max:255'],
            'nationality' => ['required', 'string', 'max:255'],
            'disability_status' => ['required', Rule::in(['no_disabilities', 'mental_impairment', 'sensory_impairment', 'physical_impairment', 'intellectual_impairment', 'other'])],
            'disability_other' => ['nullable', 'string', 'max:255'],
            'marital_status' => ['required', Rule::in(['not_married', 'planning_to_marry', 'married', 'divorced', 'widowed'])],
            'ethnic_affiliation' => ['nullable', 'string', 'max:255'],
            'religion' => ['nullable', 'string', 'max:255'],
            'languages_spoken' => ['required', 'array', 'min:1'],
            'languages_spoken.*' => ['required', 'string', 'max:255'],

            // Care / living arrangement
            'care_type' => ['required', Rule::in(['parental_care', 'no_care', 'child_carer', 'child_headed_household', 'institutional_care', 'foster_care', 'kinship_care', 'other_family_based', 'supported_independent', 'other'])],
            'care_type_other' => ['nullable', 'string', 'max:255'],
            'care_description' => ['required', 'string'],
            'current_address' => ['required', 'string'],
            'area_type' => ['nullable', Rule::in(['urban_non_camp', 'rural_non_camp', 'camp_settlement', 'other'])],
            'contact_method' => ['required', 'string'],

            // Caregiver details (nullable section)
            'caregiver_first_name' => ['nullable', 'string', 'max:255'],
            'caregiver_middle_name' => ['nullable', 'string', 'max:255'],
            'caregiver_last_name' => ['nullable', 'string', 'max:255'],
            'caregiver_dob' => ['nullable', 'date'],
            'caregiver_age' => ['nullable', 'integer', 'min:0', 'max:120'],
            'caregiver_age_estimated' => ['nullable', 'boolean'],
            'caregiver_sex' => ['nullable', Rule::in(['male', 'female', 'non_binary', 'other'])],
            'caregiver_has_id' => ['nullable', 'boolean'],
            'caregiver_id_type' => ['nullable', 'string', 'max:255'],
            'caregiver_id_number' => ['nullable', 'string', 'max:255'],
            'caregiver_nationality_status' => ['nullable', Rule::in(['national', 'other_nationality', 'stateless', 'unknown'])],
            'caregiver_displacement_status' => ['nullable', Rule::in(['host_community', 'asylum_seeker_refugee', 'idp', 'returnee', 'migrant', 'other'])],
            'caregiver_has_disabilities' => ['nullable', 'boolean'],
            'caregiver_disabilities_detail' => ['nullable', 'string'],
            'caregiver_related_to_child' => ['nullable', 'boolean'],
            'caregiver_relationship' => ['nullable', 'string', 'max:255'],
            'caregiver_knows_family' => ['nullable', 'boolean'],
            'care_arrangement_start' => ['nullable', 'date'],
            'caregiver_willing_to_continue' => ['nullable', 'boolean'],
            'caregiver_unwilling_reason' => ['nullable', 'string'],
            'caregiver_is_legal_guardian' => ['nullable', 'boolean'],
            'caregiver_contact' => ['nullable', 'string'],

            // Household
            'household_adults' => ['required', 'integer', 'min:0'],
            'household_children' => ['required', 'integer', 'min:0'],
            'main_caregiver_under_18' => ['required', 'boolean'],

            // Household members (child table)
            'household_members' => ['nullable', 'array'],
            'household_members.*.full_name' => ['required', 'string', 'max:255'],
            'household_members.*.age' => ['required', 'integer', 'min:0', 'max:120'],
            'household_members.*.relationship' => ['required', 'string', 'max:255'],

            // Protection risks
            'situation_description' => ['required', 'string'],
            'risks_identified' => ['required', 'array'],
            'risks_identified.*' => [Rule::in(['physical_violence', 'psychological_violence', 'sexual_violence', 'neglect', 'economic_exploitation', 'hazardous_labour', 'sexual_exploitation', 'conflict_with_law', 'recruitment_armed_forces', 'unaccompanied', 'separated', 'child_marriage', 'psychological_distress'])],
            'justice_system_status' => ['required', Rule::in(['no_contact', 'victim', 'witness', 'in_conflict_with_law', 'detained'])],

            // Family details — mother
            'mother_first_name' => ['required', 'string', 'max:255'],
            'mother_middle_name' => ['nullable', 'string', 'max:255'],
            'mother_last_name' => ['required', 'string', 'max:255'],
            'mother_alive' => ['required', Rule::in(['yes', 'no', 'unknown'])],
            'mother_death_note' => ['nullable', 'string'],
            'mother_nationality_status' => ['required', Rule::in(['national', 'other_nationality', 'stateless', 'unknown'])],
            'mother_displacement_status' => ['required', Rule::in(['host_community', 'asylum_seeker_refugee', 'idp', 'returnee', 'migrant', 'other'])],
            'mother_has_disabilities' => ['required', 'boolean'],
            'mother_disabilities_detail' => ['nullable', 'string'],
            'mother_in_contact' => ['required', 'boolean'],
            'mother_contact_method' => ['nullable', 'string'],
            'mother_dob' => ['required', 'date'],
            'mother_age' => ['required', 'integer', 'min:0', 'max:120'],
            'mother_age_estimated' => ['required', 'boolean'],
            'mother_has_id' => ['required', 'boolean'],
            'mother_id_type' => ['nullable', 'string', 'max:255'],
            'mother_id_number' => ['nullable', 'string', 'max:255'],

            // Family details — father
            'father_first_name' => ['required', 'string', 'max:255'],
            'father_middle_name' => ['nullable', 'string', 'max:255'],
            'father_last_name' => ['required', 'string', 'max:255'],
            'father_alive' => ['required', Rule::in(['yes', 'no', 'unknown'])],
            'father_death_note' => ['nullable', 'string'],
            'father_nationality_status' => ['required', Rule::in(['national', 'other_nationality', 'stateless', 'unknown'])],
            'father_displacement_status' => ['required', Rule::in(['host_community', 'asylum_seeker_refugee', 'idp', 'returnee', 'migrant', 'other'])],
            'father_has_disabilities' => ['required', 'boolean'],
            'father_disabilities_detail' => ['nullable', 'string'],
            'father_in_contact' => ['required', 'boolean'],
            'father_contact_method' => ['nullable', 'string'],
            'father_dob' => ['required', 'date'],
            'father_age' => ['required', 'integer', 'min:0', 'max:120'],
            'father_age_estimated' => ['required', 'boolean'],
            'father_has_id' => ['required', 'boolean'],
            'father_id_type' => ['nullable', 'string', 'max:255'],
            'father_id_number' => ['nullable', 'string', 'max:255'],

            // Immediate family members (child table)
            'immediate_family_members' => ['nullable', 'array'],
            'immediate_family_members.*.full_name' => ['required', 'string', 'max:255'],
            'immediate_family_members.*.age' => ['required', 'integer', 'min:0', 'max:120'],
            'immediate_family_members.*.relationship' => ['required', 'string', 'max:255'],
            'immediate_family_members.*.address' => ['required', 'string', 'max:255'],

            // Urgent needs
            'has_urgent_needs' => ['required', 'boolean'],
            'needs_family_tracing' => ['required', 'boolean'],

            // Immediate needs (child table)
            'immediate_needs' => ['nullable', 'array'],
            'immediate_needs.*.category' => ['required', Rule::in(['health', 'safety', 'care', 'other'])],
            'immediate_needs.*.category_other' => ['nullable', 'string', 'max:255'],
            'immediate_needs.*.summary_reasons' => ['required', 'string'],
            'immediate_needs.*.action_taken' => ['required', 'string'],

            // Risk level
            'risk_level' => ['required', Rule::in(['high', 'medium', 'low'])],
            'risk_summary' => ['required', 'string'],

            // Authorization
            'caseworker_name' => ['required', 'string', 'max:255'],
            'caseworker_date' => ['required', 'date'],
            'caseworker_signature' => ['required', 'string'],
        ];
    }
}
