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
        if (Schema::hasTable('residente') || Schema::hasTable('residentes')) {
            return;
        }

        Schema::create('residente', function (Blueprint $table) {
            $table->integer('cod_residente')->primary();
            $table->string('nombre', 50);
            $table->string('apellido', 50);
            $table->integer('edad');
            $table->string('patologia', 120);
            $table->string('RH', 6);
            $table->integer('cod_usuario');
            $table->integer('cod_rol');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('residente');
    }
};
