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
        Schema::table('usuario', function (Blueprint $table) {
            // Expand contraseña column to accommodate bcrypt hashes (60 characters)
            $table->string('contraseña', 255)->change();
            // Ensure telefono stores numeric values without formatting
            $table->string('telefono', 20)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('usuario', function (Blueprint $table) {
            $table->string('contraseña', 32)->change();
            $table->bigInteger('telefono')->change();
        });
    }
};
