<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ensure the legacy table name expected by the models exists.
     */
    public function up(): void
    {
        if (!Schema::hasTable('residente') && Schema::hasTable('residentes')) {
            Schema::rename('residentes', 'residente');
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('residentes') && Schema::hasTable('residente')) {
            Schema::rename('residente', 'residentes');
        }
    }
};
