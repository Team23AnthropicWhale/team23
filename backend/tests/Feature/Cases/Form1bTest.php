<?php

use App\Models\ChildCase;
use App\Models\Form1bSubmission;
use App\Models\User;

function validForm1bData(): array
{
    return [
        'date_identified' => '2024-01-10',
        'date_registered' => '2024-01-15',
        'caseworker_id' => 'CW-0001',
        'agency' => 'WarChild',
        'identification_source' => 'community_member',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'dob' => '2015-06-20',
        'age' => 8,
        'age_estimated' => false,
        'sex' => 'male',
        'birth_registration' => 'not_registered',
        'has_id' => false,
        'nationality_status' => 'national',
        'displacement_status' => 'host_community',
        'nationality' => 'Syrian',
        'disability_status' => 'no_disabilities',
        'marital_status' => 'not_married',
        'languages_spoken' => ['Arabic'],
        'care_type' => 'parental_care',
        'care_description' => 'Living with both parents in a shared house.',
        'current_address' => 'Camp 4, Block B, Tent 12',
        'contact_method' => 'Via father mobile number.',
        'household_adults' => 2,
        'household_children' => 3,
        'main_caregiver_under_18' => false,
        'situation_description' => 'Child has been identified as being at risk of neglect.',
        'risks_identified' => ['neglect'],
        'justice_system_status' => 'no_contact',
        'mother_first_name' => 'Fatima',
        'mother_last_name' => 'Doe',
        'mother_alive' => 'yes',
        'mother_nationality_status' => 'national',
        'mother_displacement_status' => 'host_community',
        'mother_has_disabilities' => false,
        'mother_in_contact' => true,
        'mother_dob' => '1985-03-15',
        'mother_age' => 39,
        'mother_age_estimated' => false,
        'mother_has_id' => false,
        'father_first_name' => 'Ahmed',
        'father_last_name' => 'Doe',
        'father_alive' => 'yes',
        'father_nationality_status' => 'national',
        'father_displacement_status' => 'host_community',
        'father_has_disabilities' => false,
        'father_in_contact' => true,
        'father_dob' => '1982-07-22',
        'father_age' => 41,
        'father_age_estimated' => false,
        'father_has_id' => false,
        'has_urgent_needs' => false,
        'needs_family_tracing' => false,
        'risk_level' => 'medium',
        'risk_summary' => 'Medium risk due to precarious living conditions.',
        'caseworker_name' => 'Alice Worker',
        'caseworker_date' => '2024-01-15',
        'caseworker_signature' => 'data:image/png;base64,abc123',
    ];
}

test('unauthenticated cannot submit form 1b', function () {
    $case = ChildCase::factory()->create();

    $this->postJson("/api/cases/{$case->case_id}/form-1b", validForm1bData())->assertUnauthorized();
});

test('caseworker cannot submit form 1b', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->caseWorker()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1b", validForm1bData())
        ->assertForbidden();
});

test('supervisor can submit form 1b', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1b", validForm1bData())
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'case_id', 'first_name', 'last_name', 'risk_level']]);

    expect(Form1bSubmission::where('case_id', $case->id)->exists())->toBeTrue();
});

test('submitting form 1b twice returns 422', function () {
    $case = ChildCase::factory()->create();
    Form1bSubmission::factory()->create(['case_id' => $case->id]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1b", validForm1bData())
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Form 1B has already been submitted for this case.');
});

test('form 1b validates required fields', function (string $field) {
    $case = ChildCase::factory()->create();
    $payload = validForm1bData();
    unset($payload[$field]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1b", $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors([$field]);
})->with([
    'date_identified',
    'date_registered',
    'caseworker_id',
    'agency',
    'identification_source',
    'first_name',
    'last_name',
    'dob',
    'age',
    'sex',
    'birth_registration',
    'has_id',
    'nationality_status',
    'displacement_status',
    'nationality',
    'disability_status',
    'marital_status',
    'languages_spoken',
    'care_type',
    'care_description',
    'current_address',
    'contact_method',
    'household_adults',
    'household_children',
    'main_caregiver_under_18',
    'situation_description',
    'risks_identified',
    'justice_system_status',
    'mother_first_name',
    'mother_last_name',
    'mother_alive',
    'risk_level',
    'risk_summary',
    'caseworker_name',
    'caseworker_date',
    'caseworker_signature',
]);

test('form 1b with household members stores them correctly', function () {
    $case = ChildCase::factory()->create();
    $payload = array_merge(validForm1bData(), [
        'household_members' => [
            ['full_name' => 'Sister Sarah', 'age' => 5, 'relationship' => 'sibling'],
            ['full_name' => 'Grandma Nadia', 'age' => 65, 'relationship' => 'grandparent'],
        ],
    ]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1b", $payload)
        ->assertCreated();

    $submission = Form1bSubmission::where('case_id', $case->id)->first();
    expect($submission->householdMembers)->toHaveCount(2);
    expect($submission->householdMembers->first()->full_name)->toBe('Sister Sarah');
});

test('form 1b with immediate family members stores them correctly', function () {
    $case = ChildCase::factory()->create();
    $payload = array_merge(validForm1bData(), [
        'immediate_family_members' => [
            ['full_name' => 'Uncle Ali', 'age' => 35, 'relationship' => 'uncle', 'address' => 'Block A, Tent 5'],
        ],
    ]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1b", $payload)
        ->assertCreated();

    $submission = Form1bSubmission::where('case_id', $case->id)->first();
    expect($submission->familyMembers)->toHaveCount(1);
});

test('form 1b with immediate needs stores them correctly', function () {
    $case = ChildCase::factory()->create();
    $payload = array_merge(validForm1bData(), [
        'has_urgent_needs' => true,
        'immediate_needs' => [
            ['category' => 'health', 'summary_reasons' => 'Needs medical attention.', 'action_taken' => 'Referred to clinic.'],
        ],
    ]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1b", $payload)
        ->assertCreated();

    $submission = Form1bSubmission::where('case_id', $case->id)->first();
    expect($submission->immediateNeeds)->toHaveCount(1);
    expect($submission->immediateNeeds->first()->category)->toBe('health');
});

test('form 1b response includes nested relations', function () {
    $case = ChildCase::factory()->create();
    $payload = array_merge(validForm1bData(), [
        'household_members' => [
            ['full_name' => 'Sister Sarah', 'age' => 5, 'relationship' => 'sibling'],
        ],
        'immediate_needs' => [
            ['category' => 'safety', 'summary_reasons' => 'At risk.', 'action_taken' => 'Monitoring.'],
        ],
    ]);

    $response = $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1b", $payload)
        ->assertCreated();

    expect($response->json('data.household_members'))->toHaveCount(1);
    expect($response->json('data.immediate_needs'))->toHaveCount(1);
});

test('unauthenticated cannot view form 1b', function () {
    $case = ChildCase::factory()->create();

    $this->getJson("/api/cases/{$case->case_id}/form-1b")->assertUnauthorized();
});

test('supervisor can view form 1b submission', function () {
    $case = ChildCase::factory()->create();
    $submission = Form1bSubmission::factory()->create(['case_id' => $case->id]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson("/api/cases/{$case->case_id}/form-1b")
        ->assertOk()
        ->assertJsonPath('data.id', $submission->id)
        ->assertJsonPath('data.risk_level', $submission->risk_level);
});

test('viewing form 1b for case without submission returns 404', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson("/api/cases/{$case->case_id}/form-1b")
        ->assertNotFound();
});
