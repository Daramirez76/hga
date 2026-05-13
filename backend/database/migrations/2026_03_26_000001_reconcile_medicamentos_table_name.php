<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('medicamentos') || !Schema::hasTable('medicamento')) {
            return;
        }

        Schema::rename('medicamento', 'medicamentos');
    }

    public function down(): void
    {
        if (Schema::hasTable('medicamento') || !Schema::hasTable('medicamentos')) {
            return;
        }

        Schema::rename('medicamentos', 'medicamento');
    }
};
