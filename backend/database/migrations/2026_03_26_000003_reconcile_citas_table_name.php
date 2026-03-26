<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('citas')) {
            return;
        }

        if (Schema::hasTable('_citas')) {
            Schema::rename('_citas', 'citas');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('_citas') || !Schema::hasTable('citas')) {
            return;
        }

        Schema::rename('citas', '_citas');
    }
};
