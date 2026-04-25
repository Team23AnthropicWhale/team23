<?php

namespace Database\Factories;

use App\Models\ChildCase;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChildCase>
 */
class ChildCaseFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'case_id' => strtoupper(fake()->bothify('WAR-####-???')),
        ];
    }
}
