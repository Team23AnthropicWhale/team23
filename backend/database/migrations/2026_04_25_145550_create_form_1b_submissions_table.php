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
        Schema::create('form_1b_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('cases')->cascadeOnDelete();

            // Case information
            $table->date('date_identified');
            $table->date('date_registered');
            $table->date('date_reopened')->nullable();
            $table->string('caseworker_id');
            $table->string('agency');
            $table->enum('identification_source', ['self_referral', 'family_member', 'community_member', 'media', 'other_service_provider', 'un_ingo_ngo']);
            $table->enum('identification_source_sector', ['education', 'food_security', 'health', 'livelihoods', 'nutrition', 'protection', 'child_protection', 'gbv', 'shelter', 'camp_coordination', 'wash', 'other'])->nullable();
            $table->string('identification_source_other')->nullable();

            // Child personal details
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('other_names')->nullable();
            $table->date('dob');
            $table->unsignedSmallInteger('age');
            $table->boolean('age_estimated');
            $table->enum('sex', ['male', 'female', 'non_binary', 'other']);
            $table->enum('birth_registration', ['registered', 'not_registered', 'in_progress']);
            $table->boolean('has_id');
            $table->string('id_type')->nullable();
            $table->string('id_number')->nullable();
            $table->enum('nationality_status', ['national', 'other_nationality', 'stateless', 'unknown']);
            $table->enum('displacement_status', ['host_community', 'asylum_seeker_refugee', 'idp', 'returnee', 'migrant', 'other']);
            $table->string('displacement_status_other')->nullable();
            $table->string('nationality');
            $table->enum('disability_status', ['no_disabilities', 'mental_impairment', 'sensory_impairment', 'physical_impairment', 'intellectual_impairment', 'other']);
            $table->string('disability_other')->nullable();
            $table->enum('marital_status', ['not_married', 'planning_to_marry', 'married', 'divorced', 'widowed']);
            $table->string('ethnic_affiliation')->nullable();
            $table->string('religion')->nullable();
            $table->json('languages_spoken');

            // Care / living arrangement
            $table->enum('care_type', ['parental_care', 'no_care', 'child_carer', 'child_headed_household', 'institutional_care', 'foster_care', 'kinship_care', 'other_family_based', 'supported_independent', 'other']);
            $table->string('care_type_other')->nullable();
            $table->text('care_description');
            $table->text('current_address');
            $table->enum('area_type', ['urban_non_camp', 'rural_non_camp', 'camp_settlement', 'other'])->nullable();
            $table->text('contact_method');

            // Caregiver details (nullable — section applies only when child is not in parental care)
            $table->string('caregiver_first_name')->nullable();
            $table->string('caregiver_middle_name')->nullable();
            $table->string('caregiver_last_name')->nullable();
            $table->date('caregiver_dob')->nullable();
            $table->unsignedSmallInteger('caregiver_age')->nullable();
            $table->boolean('caregiver_age_estimated')->nullable();
            $table->enum('caregiver_sex', ['male', 'female', 'non_binary', 'other'])->nullable();
            $table->boolean('caregiver_has_id')->nullable();
            $table->string('caregiver_id_type')->nullable();
            $table->string('caregiver_id_number')->nullable();
            $table->enum('caregiver_nationality_status', ['national', 'other_nationality', 'stateless', 'unknown'])->nullable();
            $table->enum('caregiver_displacement_status', ['host_community', 'asylum_seeker_refugee', 'idp', 'returnee', 'migrant', 'other'])->nullable();
            $table->boolean('caregiver_has_disabilities')->nullable();
            $table->text('caregiver_disabilities_detail')->nullable();
            $table->boolean('caregiver_related_to_child')->nullable();
            $table->string('caregiver_relationship')->nullable();
            $table->boolean('caregiver_knows_family')->nullable();
            $table->date('care_arrangement_start')->nullable();
            $table->boolean('caregiver_willing_to_continue')->nullable();
            $table->text('caregiver_unwilling_reason')->nullable();
            $table->boolean('caregiver_is_legal_guardian')->nullable();
            $table->text('caregiver_contact')->nullable();

            // Household
            $table->unsignedSmallInteger('household_adults');
            $table->unsignedSmallInteger('household_children');
            $table->boolean('main_caregiver_under_18');

            // Protection risks
            $table->text('situation_description');
            $table->json('risks_identified');
            $table->enum('justice_system_status', ['no_contact', 'victim', 'witness', 'in_conflict_with_law', 'detained']);

            // Family details — mother
            $table->string('mother_first_name');
            $table->string('mother_middle_name')->nullable();
            $table->string('mother_last_name');
            $table->enum('mother_alive', ['yes', 'no', 'unknown']);
            $table->text('mother_death_note')->nullable();
            $table->enum('mother_nationality_status', ['national', 'other_nationality', 'stateless', 'unknown']);
            $table->enum('mother_displacement_status', ['host_community', 'asylum_seeker_refugee', 'idp', 'returnee', 'migrant', 'other']);
            $table->boolean('mother_has_disabilities');
            $table->text('mother_disabilities_detail')->nullable();
            $table->boolean('mother_in_contact');
            $table->text('mother_contact_method')->nullable();
            $table->date('mother_dob');
            $table->unsignedSmallInteger('mother_age');
            $table->boolean('mother_age_estimated');
            $table->boolean('mother_has_id');
            $table->string('mother_id_type')->nullable();
            $table->string('mother_id_number')->nullable();

            // Family details — father
            $table->string('father_first_name');
            $table->string('father_middle_name')->nullable();
            $table->string('father_last_name');
            $table->enum('father_alive', ['yes', 'no', 'unknown']);
            $table->text('father_death_note')->nullable();
            $table->enum('father_nationality_status', ['national', 'other_nationality', 'stateless', 'unknown']);
            $table->enum('father_displacement_status', ['host_community', 'asylum_seeker_refugee', 'idp', 'returnee', 'migrant', 'other']);
            $table->boolean('father_has_disabilities');
            $table->text('father_disabilities_detail')->nullable();
            $table->boolean('father_in_contact');
            $table->text('father_contact_method')->nullable();
            $table->date('father_dob');
            $table->unsignedSmallInteger('father_age');
            $table->boolean('father_age_estimated');
            $table->boolean('father_has_id');
            $table->string('father_id_type')->nullable();
            $table->string('father_id_number')->nullable();

            // Urgent needs
            $table->boolean('has_urgent_needs');
            $table->boolean('needs_family_tracing');

            // Risk level
            $table->enum('risk_level', ['high', 'medium', 'low']);
            $table->text('risk_summary');

            // Authorization
            $table->string('caseworker_name');
            $table->date('caseworker_date');
            $table->text('caseworker_signature');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_1b_submissions');
    }
};
