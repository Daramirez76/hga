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
        if (Schema::hasTable('usuario')) {
            return;
        }

        Schema::create('usuario', function (Blueprint $table) {
            $table->string('tipo_doc', 16);
            $table->integer('doc_id')->primary();
            $table->string('nombre', 100);
            $table->string('apellido', 100);
            $table->integer('edad');
            $table->string('direccion', 150);
            $table->bigInteger('telefono');
            $table->string('email', 100)->unique();
            $table->string('usuario', 100)->unique();
            $table->string('contraseña', 32);
            $table->integer('cod_rol');
            $table->string('parentesco', 32)->default('');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuario');
    }
};
