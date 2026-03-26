<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('informes')) {
            return;
        }

        Schema::create('informes', function (Blueprint $table) {
            $table->integer('cod_Informes')->primary();
            $table->integer('doc_id');
            $table->integer('cod_Residente');
            $table->string('Titulo_Informes', 255);
            $table->string('descripcion', 500)->nullable();
            $table->string('tipo', 50)->default('general');
            $table->string('urgencia', 20)->default('normal');
            $table->integer('cod_rol');
            $table->index('doc_id');
            $table->index('cod_Residente');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('informes');
    }
};
