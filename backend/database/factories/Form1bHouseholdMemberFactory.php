<?php

namespace Database\Factories;

use App\Models\Form1bHouseholdMember;
use App\Models\Form1bSubmission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Form1bHouseholdMember>
 */
class Form1bHouseholdMemberFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'form_1b_submission_id' => Form1bSubmission::factory(),
            'full_name' => fake()->name(),
            'age' => fake()->numberBetween(1, 70),
            'relationship' => fake()->randomElement(['parent', 'sibling', 'grandparent', 'uncle', 'aunt']),
        ];
    }
}
