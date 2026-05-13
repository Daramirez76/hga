<?php

namespace App\Repositories\Eloquent;

use App\Models\medicamentos;
use App\Repositories\Interfaces\medicamentosInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class medicamentosRepository implements medicamentosInterface
{
    public function getAllmedicamentos()
    {
        return medicamentos::all();
    }

    public function getmedicamentosById(int $id)
    {
        $medicamentos = medicamentos::find($id);

        return !$medicamentos ? null : $medicamentos;
    }

    public function create(array $data)
    {
        return $this->createWithGeneratedCode($data);
    }

    public function update(int $id, array $data)
    {
        $medicamentos = medicamentos::find($id);

        if (!$medicamentos) {
            return null;
        }

        $medicamentos->update($data);
        return $medicamentos;
    }

    public function delete(int $id)
    {
        $medicamentos = medicamentos::find($id);

        if (!$medicamentos) {
            return null;
        }

        $medicamentos->delete();
        return true;
    }

    public function getNextCodMedicamento(): int
    {
        $lastCode = medicamentos::query()
            ->orderByDesc('Cod_medicamento')
            ->value('Cod_medicamento');

        return $lastCode ? ((int) $lastCode + 1) : 1;
    }

    protected function createWithGeneratedCode(array $data, int $attempt = 0)
    {
        try {
            return DB::transaction(function () use ($data) {
                $payload = $data;

                if (empty($payload['Cod_medicamento'])) {
                    $payload['Cod_medicamento'] = $this->getNextCodMedicamentoForTransaction();
                }

                return medicamentos::create($payload);
            });
        } catch (QueryException $exception) {
            if ($this->shouldRetryAfterDuplicateKey($exception) && empty($data['Cod_medicamento']) && $attempt < 2) {
                usleep(50000 * ($attempt + 1));

                return $this->createWithGeneratedCode($data, $attempt + 1);
            }

            throw $exception;
        }
    }

    protected function getNextCodMedicamentoForTransaction(): int
    {
        $lastCode = medicamentos::query()
            ->select('Cod_medicamento')
            ->orderByDesc('Cod_medicamento')
            ->lockForUpdate()
            ->value('Cod_medicamento');

        return $lastCode ? ((int) $lastCode + 1) : 1;
    }

    protected function shouldRetryAfterDuplicateKey(QueryException $exception): bool
    {
        $sqlState = (string) $exception->getCode();
        $driverCode = (int) ($exception->errorInfo[1] ?? 0);
        $message = strtolower($exception->getMessage());

        return in_array($sqlState, ['23000', '23505'], true)
            || in_array($driverCode, [19, 1062, 2601, 2627], true)
            || str_contains($message, 'duplicate')
            || str_contains($message, 'unique constraint')
            || str_contains($message, 'primary key constraint');
    }
}
