type ApiError = { status?: number };

export const getInviteErrorMessage = (error: ApiError) =>
  error.status === 409
    ? "Pengguna dengan email ini sudah ada di dalam tim atau sudah diundang."
    : "Gagal mengirim undangan. Silakan coba lagi.";

export const teamMutationErrorMessages = {
  updateRole: "Gagal memperbarui peran pengguna.",
  removeMember: "Gagal mencabut akses anggota.",
  revokeInvitation: "Gagal membatalkan undangan.",
} as const;