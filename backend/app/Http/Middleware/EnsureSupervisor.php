<?php

namespace App\Http\Middleware;

use App\Enums\UserType;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSupervisor
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->user_type !== UserType::SUPERVISOR) {
            abort(403, 'Only supervisors can access this resource.');
        }

        return $next($request);
    }
}
