<?php

namespace App\Enums;

enum UserType: string
{
    case SUPERVISOR = 'supervisor';
    case CASEWORKER = 'case_worker';
}
