<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('informes') && Schema::hasTable('_informados')) {
            Schema::rename('_informados', 'informes');
        }

        if (!Schema::hasTable('informes')) {
            return;
        }

        $hasLegacyTitle = Schema::hasColumn('informes', 'Titulo_Informe');
        $hasCurrentTitle = Schema::hasColumn('informes', 'Titulo_Informes');
        $hasDescription = Schema::hasColumn('informes', 'descripcion');
        $hasType = Schema::hasColumn('informes', 'tipo');
        $hasUrgency = Schema::hasColumn('informes', 'urgencia');

        if ($hasLegacyTitle && !$hasCurrentTitle) {
            Schema::table('informes', function (Blueprint $table) {
                $table->renameColumn('Titulo_Informe', 'Titulo_Informes');
            });
        }

        if (!$hasDescription || !$hasType || !$hasUrgency) {
            Schema::table('informes', function (Blueprint $table) use ($hasDescription, $hasType, $hasUrgency) {
                if (!$hasDescription) {
                    $table->string('descripcion', 500)->nullable();
                }

                if (!$hasType) {
                    $table->string('tipo', 50)->default('general');
                }

                if (!$hasUrgency) {
                    $table->string('urgencia', 20)->default('normal');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('_informados') || !Schema::hasTable('informes')) {
            return;
        }

        if (Schema::hasColumn('informes', 'Titulo_Informes') && !Schema::hasColumn('informes', 'Titulo_Informe')) {
            Schema::table('informes', function (Blueprint $table) {
                $table->renameColumn('Titulo_Informes', 'Titulo_Informe');
            });
        }

        Schema::rename('informes', '_informados');
    }
};
