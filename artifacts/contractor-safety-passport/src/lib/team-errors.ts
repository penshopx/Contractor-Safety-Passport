type ApiError = {
  status?: number;
  data?: unknown;
};

type TeamMutation = "updateRole" | "removeMember" | "revokeInvitation";

const getErrorReason = (error: ApiError): string | undefined => {
  if (
    typeof error.data !== "object" ||
    error.data === null ||
    !("error" in error.data)
  ) {
    return undefined;
  }

  return typeof error.data.error === "string" ? error.data.error : undefined;
};

export const getInviteErrorMessage = (error: ApiError) =>
  error.status === 409
    ? "Pengguna dengan email ini sudah ada di dalam tim atau sudah diundang."
    : "Gagal mengirim undangan. Silakan coba lagi.";

export const teamMutationErrorMessages = {
  updateRole: "Gagal memperbarui peran pengguna. Silakan coba lagi.",
  removeMember: "Gagal mencabut akses anggota. Silakan coba lagi.",
  revokeInvitation: "Gagal membatalkan undangan. Silakan coba lagi.",
} as const;

const actionableMessages: Record<
  TeamMutation,
  Partial<Record<number, Record<string, string>>>
> = {
  updateRole: {
    403: {
      "Peran pemilik tidak dapat diubah":
        "Peran pemilik workspace tidak dapat diubah.",
    },
    404: {
      "Anggota tidak ditemukan":
        "Anggota tidak ditemukan. Muat ulang halaman untuk melihat daftar tim terbaru.",
    },
  },
  removeMember: {
    403: {
      "Pemilik tidak dapat menghapus dirinya sendiri":
        "Anda tidak dapat mencabut akses diri sendiri sebagai pemilik workspace.",
      "Pemilik ruang kerja tidak dapat dihapus":
        "Akses pemilik workspace tidak dapat dicabut.",
    },
    404: {
      "Anggota tidak ditemukan":
        "Anggota tidak ditemukan. Mungkin aksesnya sudah dicabut; muat ulang halaman.",
    },
  },
  revokeInvitation: {
    404: {
      "Undangan aktif tidak ditemukan":
        "Undangan sudah tidak aktif. Mungkin sudah digunakan atau dibatalkan; muat ulang halaman.",
    },
  },
};

export const getTeamMutationErrorMessage = (
  mutation: TeamMutation,
  error: ApiError,
) => {
  const reason = getErrorReason(error);
  if (error.status !== undefined && reason) {
    const actionableMessage = actionableMessages[mutation][error.status]?.[reason];
    if (actionableMessage) {
      return actionableMessage;
    }
  }

  return teamMutationErrorMessages[mutation];
};
