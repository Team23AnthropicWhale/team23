<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('form_2_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('cases')->cascadeOnDelete();

            // Case information
            $table->date('date_started');
            $table->date('date_completed')->nullable();
            $table->enum('contact_type', ['home_visit', 'meeting_other_location', 'phone_call', 'other']);
            $table->json('who_present');
            $table->string('who_present_other')->nullable();
            $table->boolean('is_reopened');
            $table->date('previous_closure_date')->nullable();

            // Assessment of current situation
            $table->text('safety');
            $table->text('family_caregiving');
            $table->text('physical_health');
            $table->text('emotional_wellbeing');
            $table->enum('education_status', ['no_learning', 'formal_education', 'other_learning']);
            $table->text('education_detail')->nullable();
            $table->text('friends_social');
            $table->text('work');
            $table->text('legal_documentation');

            // Incident details (sensitive, all optional)
            $table->boolean('perpetrator_known')->nullable();
            $table->enum('perpetrator_type', ['family_member', 'intimate_partner', 'peer', 'formal_authority', 'employer', 'un_ngo_staff', 'armed_force', 'other'])->nullable();
            $table->string('perpetrator_other')->nullable();
            $table->boolean('incident_location_known')->nullable();
            $table->enum('incident_location', ['inside_home', 'outside_home', 'education_vocational', 'medical_facilities', 'residential_care', 'workplace', 'detention', 'digital', 'other'])->nullable();
            $table->string('incident_location_other')->nullable();

            // Views of the child
            $table->text('child_views_wishes');
            $table->boolean('child_seen_individually');
            $table->text('caregiver_views_wishes');

            // Analysis
            $table->text('risk_factors');
            $table->text('protective_factors');
            $table->text('additional_notes')->nullable();
            $table->boolean('bid_required');

            // Authorization — caseworker
            $table->string('caseworker_name');
            $table->date('caseworker_date');
            $table->text('caseworker_signature');

            // Authorization — supervisor
            $table->string('supervisor_name');
            $table->date('supervisor_date');
            $table->text('supervisor_signature');
            $table->text('supervisor_comments')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_2_submissions');
    }
};
