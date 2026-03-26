<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('actividades_ludicas')) {
            return;
        }

        if (Schema::hasTable('_actividades')) {
            Schema::rename('_actividades', 'actividades_ludicas');
            return;
        }

        if (Schema::hasTable('actividades')) {
            Schema::rename('actividades', 'actividades_ludicas');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('_actividades') || !Schema::hasTable('actividades_ludicas')) {
            return;
        }

        Schema::rename('actividades_ludicas', '_actividades');
    }
};
