<?php

namespace App\Services;

use App\Repositories\Eloquent\usuariosRepository as UserRepository;

class olvideContrasenaService
{
    protected UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * @param string $email
     * @return array
     */
    public function requestReset(string $email): array
    {
        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            return [
                'success' => false,
                'mensaje' => 'No existe una cuenta asociada a ese correo',
            ];
        }

        return [
            'success' => true,
            'mensaje' => 'Solicitud recibida. Ya puedes restablecer tu contraseña.',
        ];
    }

    /**
     * @param string $email
     * @param string $newPassword
     * @return array
     */
    public function resetPassword(string $email, string $newPassword): array
    {
        $updated = $this->userRepository->updatePasswordByEmail($email, $newPassword);

        if (!$updated) {
            return [
                'success' => false,
                'mensaje' => 'No fue posible actualizar la contraseña',
            ];
        }

        return [
            'success' => true,
            'mensaje' => 'Contraseña actualizada exitosamente',
        ];
    }
}
