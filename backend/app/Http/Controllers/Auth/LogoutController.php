<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Revoke the current API token (logout).
 *
 * ---
 * POST /api/auth/logout
 * Requires: Authorization: Bearer <token>
 *
 * Success — 204 No Content (empty body)
 *
 * React Native usage:
 *   Call this before clearing the stored token on the device.
 *   On 204, delete the token from expo-secure-store and navigate to login.
 */
class LogoutController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}
