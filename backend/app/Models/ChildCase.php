<?php

namespace App\Models;

use Database\Factories\ChildCaseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['case_id'])]
class ChildCase extends Model
{
    /** @use HasFactory<ChildCaseFactory> */
    use HasFactory;

    protected $table = 'cases';

    public function getRouteKeyName(): string
    {
        return 'case_id';
    }

    public function form1aSubmission(): HasOne
    {
        return $this->hasOne(Form1aSubmission::class, 'case_id');
    }

    public function form1bSubmission(): HasOne
    {
        return $this->hasOne(Form1bSubmission::class, 'case_id');
    }

    public function form2Submission(): HasOne
    {
        return $this->hasOne(Form2Submission::class, 'case_id');
    }
}
