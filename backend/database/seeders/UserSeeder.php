<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::factory()->supervisor()->create([
            'name' => 'Sarah Supervisor',
            'email' => 'supervisor@team23.test',
            'password' => Hash::make('password'),
        ]);

        User::factory()->caseWorker()->create([
            'name' => 'Charlie Caseworker',
            'email' => 'caseworker@team23.test',
            'password' => Hash::make('password'),
        ]);

        User::factory()->caseWorker()->create([
            'name' => 'Alice Caseworker',
            'email' => 'caseworker2@team23.test',
            'password' => Hash::make('password'),
        ]);
    }
}
