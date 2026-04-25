<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

/**
 * Return the currently authenticated user.
 *
 * ---
 * GET /api/auth/me
 * Requires: Authorization: Bearer <token>
 *
 * Success — 200 OK:
 * {
 *   "data": {
 *     "id": 1,
 *     "name": "Jane Doe",
 *     "email": "caseworker@example.com",
 *     "user_type": "case_worker"   // "case_worker" | "supervisor"
 *   }
 * }
 *
 * React Native usage:
 *   Call on app launch after loading the stored token to restore the session.
 *   On 401, the token is invalid/expired — redirect to login.
 */
class MeController extends Controller
{
    public function __invoke(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
