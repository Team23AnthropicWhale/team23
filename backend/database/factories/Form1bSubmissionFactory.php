<?php

namespace Database\Factories;

use App\Models\ChildCase;
use App\Models\Form1bSubmission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Form1bSubmission>
 */
class Form1bSubmissionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $dob = fake()->dateTimeBetween('-17 years', '-1 year');
        $age = now()->diffInYears($dob);

        $motherDob = fake()->dateTimeBetween('-60 years', '-20 years');
        $fatherDob = fake()->dateTimeBetween('-60 years', '-20 years');

        return [
            'case_id' => ChildCase::factory(),
            'date_identified' => fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'date_registered' => fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'date_reopened' => null,
            'caseworker_id' => 'CW-'.fake()->numerify('####'),
            'agency' => fake()->company(),
            'identification_source' => fake()->randomElement(['self_referral', 'family_member', 'community_member', 'media', 'other_service_provider', 'un_ingo_ngo']),
            'identification_source_sector' => null,
            'identification_source_other' => null,
            'first_name' => fake()->firstName(),
            'middle_name' => null,
            'last_name' => fake()->lastName(),
            'other_names' => null,
            'dob' => $dob->format('Y-m-d'),
            'age' => $age,
            'age_estimated' => false,
            'sex' => fake()->randomElement(['male', 'female']),
            'birth_registration' => fake()->randomElement(['registered', 'not_registered', 'in_progress']),
            'has_id' => false,
            'id_type' => null,
            'id_number' => null,
            'nationality_status' => fake()->randomElement(['national', 'other_nationality', 'stateless', 'unknown']),
            'displacement_status' => fake()->randomElement(['host_community', 'asylum_seeker_refugee', 'idp', 'returnee', 'migrant', 'other']),
            'displacement_status_other' => null,
            'nationality' => fake()->country(),
            'disability_status' => 'no_disabilities',
            'disability_other' => null,
            'marital_status' => 'not_married',
            'ethnic_affiliation' => null,
            'religion' => null,
            'languages_spoken' => ['Arabic'],
            'care_type' => fake()->randomElement(['parental_care', 'kinship_care', 'foster_care']),
            'care_type_other' => null,
            'care_description' => fake()->sentence(),
            'current_address' => fake()->address(),
            'area_type' => fake()->randomElement(['urban_non_camp', 'rural_non_camp', 'camp_settlement']),
            'contact_method' => fake()->sentence(),
            'caregiver_first_name' => null,
            'caregiver_middle_name' => null,
            'caregiver_last_name' => null,
            'caregiver_dob' => null,
            'caregiver_age' => null,
            'caregiver_age_estimated' => null,
            'caregiver_sex' => null,
            'caregiver_has_id' => null,
            'caregiver_id_type' => null,
            'caregiver_id_number' => null,
            'caregiver_nationality_status' => null,
            'caregiver_displacement_status' => null,
            'caregiver_has_disabilities' => null,
            'caregiver_disabilities_detail' => null,
            'caregiver_related_to_child' => null,
            'caregiver_relationship' => null,
            'caregiver_knows_family' => null,
            'care_arrangement_start' => null,
            'caregiver_willing_to_continue' => null,
            'caregiver_unwilling_reason' => null,
            'caregiver_is_legal_guardian' => null,
            'caregiver_contact' => null,
            'household_adults' => fake()->numberBetween(1, 5),
            'household_children' => fake()->numberBetween(1, 4),
            'main_caregiver_under_18' => false,
            'situation_description' => fake()->paragraph(),
            'risks_identified' => ['neglect'],
            'justice_system_status' => 'no_contact',
            'mother_first_name' => fake()->firstName('female'),
            'mother_middle_name' => null,
            'mother_last_name' => fake()->lastName(),
            'mother_alive' => fake()->randomElement(['yes', 'no', 'unknown']),
            'mother_death_note' => null,
            'mother_nationality_status' => 'national',
            'mother_displacement_status' => 'host_community',
            'mother_has_disabilities' => false,
            'mother_disabilities_detail' => null,
            'mother_in_contact' => true,
            'mother_contact_method' => null,
            'mother_dob' => $motherDob->format('Y-m-d'),
            'mother_age' => now()->diffInYears($motherDob),
            'mother_age_estimated' => false,
            'mother_has_id' => false,
            'mother_id_type' => null,
            'mother_id_number' => null,
            'father_first_name' => fake()->firstName('male'),
            'father_middle_name' => null,
            'father_last_name' => fake()->lastName(),
            'father_alive' => fake()->randomElement(['yes', 'no', 'unknown']),
            'father_death_note' => null,
            'father_nationality_status' => 'national',
            'father_displacement_status' => 'host_community',
            'father_has_disabilities' => false,
            'father_disabilities_detail' => null,
            'father_in_contact' => true,
            'father_contact_method' => null,
            'father_dob' => $fatherDob->format('Y-m-d'),
            'father_age' => now()->diffInYears($fatherDob),
            'father_age_estimated' => false,
            'father_has_id' => false,
            'father_id_type' => null,
            'father_id_number' => null,
            'has_urgent_needs' => false,
            'needs_family_tracing' => false,
            'risk_level' => fake()->randomElement(['high', 'medium', 'low']),
            'risk_summary' => fake()->paragraph(),
            'caseworker_name' => fake()->name(),
            'caseworker_date' => fake()->date(),
            'caseworker_signature' => 'data:image/png;base64,signature_placeholder',
        ];
    }
}
