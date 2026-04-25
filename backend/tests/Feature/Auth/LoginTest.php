<?php

use App\Enums\UserType;
use App\Models\User;

test('login returns a token and user for valid credentials', function () {
    $user = User::factory()->caseWorker()->create(['password' => bcrypt('secret')]);

    $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'secret',
        'device_name' => 'Test Device',
    ])
        ->assertOk()
        ->assertJsonStructure(['token', 'user' => [
            'id',
            'name',
            'email',
            'user_type'
        ]]);
});

test('login response includes the correct user_type', function () {
    $supervisor = User::factory()->supervisor()->create(['password' => bcrypt('secret')]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $supervisor->email,
        'password' => 'secret',
        'device_name' => 'Test Device',
    ])->assertOk();

    expect($response->json('user.user_type'))->toBe(UserType::SUPERVISOR->value);
});

test('login returns 422 for incorrect password', function () {
    $user = User::factory()->create();

    $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
        'device_name' => 'Test Device',
    ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
});

test('login returns 422 for unknown email', function () {
    $this->postJson('/api/auth/login', [
        'email' => 'nobody@example.com',
        'password' => 'password',
        'device_name' => 'Test Device',
    ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
});

test('login validates required fields', function (array $body, string $field) {
    $this->postJson('/api/auth/login', $body)
        ->assertUnprocessable()
        ->assertJsonValidationErrors([$field]);
})->with([
    'missing email' => [['password' => 'password', 'device_name' => 'device'], 'email'],
    'missing password' => [['email' => 'a@b.com', 'device_name' => 'device'], 'password'],
    'missing device_name' => [['email' => 'a@b.com', 'password' => 'password'], 'device_name'],
]);
