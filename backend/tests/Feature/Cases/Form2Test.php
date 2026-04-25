<?php

use App\Models\ChildCase;
use App\Models\Form2Submission;
use App\Models\User;

function validForm2Data(): array
{
    return [
        'date_started' => '2024-02-01',
        'date_completed' => '2024-02-01',
        'contact_type' => 'home_visit',
        'who_present' => ['child', 'parent_caregiver'],
        'is_reopened' => false,
        'safety' => 'Child appears physically safe. No signs of abuse observed.',
        'family_caregiving' => 'Both parents present and engaged. Mother is primary caregiver.',
        'physical_health' => 'Child appears healthy, no visible injuries or malnutrition.',
        'emotional_wellbeing' => 'Child is withdrawn but engaged when spoken to directly.',
        'education_status' => 'formal_education',
        'friends_social' => 'Child has some peer connections within the camp.',
        'work' => 'Not working. Attends school regularly.',
        'legal_documentation' => 'No documentation available.',
        'child_views_wishes' => 'Child expressed desire to return to school and be with friends.',
        'child_seen_individually' => true,
        'caregiver_views_wishes' => 'Parents want stability and access to education for the child.',
        'risk_factors' => 'Unstable housing, limited income, displaced family.',
        'protective_factors' => 'Strong parental bond, motivated family, community support.',
        'bid_required' => false,
        'caseworker_name' => 'Alice Worker',
        'caseworker_date' => '2024-02-01',
        'caseworker_signature' => 'data:image/png;base64,abc123',
        'supervisor_name' => 'Bob Supervisor',
        'supervisor_date' => '2024-02-02',
        'supervisor_signature' => 'data:image/png;base64,def456',
    ];
}

test('unauthenticated cannot submit form 2', function () {
    $case = ChildCase::factory()->create();

    $this->postJson("/api/cases/{$case->case_id}/form-2", validForm2Data())->assertUnauthorized();
});

test('caseworker cannot submit form 2', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->caseWorker()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-2", validForm2Data())
        ->assertForbidden();
});

test('supervisor can submit form 2', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-2", validForm2Data())
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'case_id', 'safety', 'risk_factors', 'bid_required']]);

    expect(Form2Submission::where('case_id', $case->id)->exists())->toBeTrue();
});

test('submitting form 2 twice returns 422', function () {
    $case = ChildCase::factory()->create();
    Form2Submission::factory()->create(['case_id' => $case->id]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-2", validForm2Data())
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Form 2 has already been submitted for this case.');
});

test('form 2 validates required fields', function (string $field) {
    $case = ChildCase::factory()->create();
    $payload = validForm2Data();
    unset($payload[$field]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-2", $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors([$field]);
})->with([
    'date_started',
    'contact_type',
    'who_present',
    'is_reopened',
    'safety',
    'family_caregiving',
    'physical_health',
    'emotional_wellbeing',
    'education_status',
    'friends_social',
    'work',
    'legal_documentation',
    'child_views_wishes',
    'child_seen_individually',
    'caregiver_views_wishes',
    'risk_factors',
    'protective_factors',
    'bid_required',
    'caseworker_name',
    'caseworker_date',
    'caseworker_signature',
    'supervisor_name',
    'supervisor_date',
    'supervisor_signature',
]);

test('form 2 contact_type must be a valid option', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-2", array_merge(validForm2Data(), ['contact_type' => 'invalid']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['contact_type']);
});

test('form 2 previous_closure_date is required when case is reopened', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-2", array_merge(validForm2Data(), [
            'is_reopened' => true,
            'previous_closure_date' => null,
        ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['previous_closure_date']);
});

test('form 2 stores optional incident details', function () {
    $case = ChildCase::factory()->create();
    $payload = array_merge(validForm2Data(), [
        'perpetrator_known' => true,
        'perpetrator_type' => 'family_member',
        'incident_location_known' => true,
        'incident_location' => 'inside_home',
    ]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-2", $payload)
        ->assertCreated()
        ->assertJsonPath('data.perpetrator_type', 'family_member')
        ->assertJsonPath('data.incident_location', 'inside_home');
});

test('unauthenticated cannot view form 2', function () {
    $case = ChildCase::factory()->create();

    $this->getJson("/api/cases/{$case->case_id}/form-2")->assertUnauthorized();
});

test('supervisor can view form 2 submission', function () {
    $case = ChildCase::factory()->create();
    $submission = Form2Submission::factory()->create(['case_id' => $case->id]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson("/api/cases/{$case->case_id}/form-2")
        ->assertOk()
        ->assertJsonPath('data.id', $submission->id)
        ->assertJsonPath('data.bid_required', $submission->bid_required);
});

test('viewing form 2 for case without submission returns 404', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson("/api/cases/{$case->case_id}/form-2")
        ->assertNotFound();
});

test('form 2 response contains all assessment fields', function () {
    $case = ChildCase::factory()->create();
    Form2Submission::factory()->create(['case_id' => $case->id]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson("/api/cases/{$case->case_id}/form-2")
        ->assertOk()
        ->assertJsonStructure(['data' => [
            'id', 'case_id', 'date_started', 'contact_type', 'who_present',
            'safety', 'family_caregiving', 'physical_health', 'emotional_wellbeing',
            'education_status', 'friends_social', 'work', 'legal_documentation',
            'child_views_wishes', 'caregiver_views_wishes',
            'risk_factors', 'protective_factors', 'bid_required',
            'caseworker_name', 'supervisor_name',
        ]]);
});
