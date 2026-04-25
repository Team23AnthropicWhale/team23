<?php

namespace Database\Factories;

use App\Models\Form1bFamilyMember;
use App\Models\Form1bSubmission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Form1bFamilyMember>
 */
class Form1bFamilyMemberFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'form_1b_submission_id' => Form1bSubmission::factory(),
            'full_name' => fake()->name(),
            'age' => fake()->numberBetween(1, 60),
            'relationship' => fake()->randomElement(['sibling', 'aunt', 'uncle', 'cousin', 'grandparent']),
            'address' => fake()->address(),
        ];
    }
}
