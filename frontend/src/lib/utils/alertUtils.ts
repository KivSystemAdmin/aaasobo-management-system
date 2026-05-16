import Swal from "sweetalert2";

export const confirmAlert: (text: string) => Promise<boolean> = (
  text: string,
) => {
  const result = Swal.fire({
    text,
    icon: "warning",
    confirmButtonText: "OK",
    cancelButtonText: "Cancel",
    showCancelButton: true,
    showConfirmButton: true,
    didOpen: () => {
      const container = Swal.getContainer()!;
      container.style.zIndex = "99999";
    },
  }).then((result) => {
    if (result.isConfirmed) {
      return true;
    } else {
      return false;
    }
  });
  return result;
};

export const successAlert: (text: string) => Promise<void> = async (
  text: string,
) => {
  Swal.fire({
    text,
    icon: "success",
    confirmButtonText: "OK",
    showConfirmButton: true,
    didOpen: () => {
      const container = Swal.getContainer()!;
      container.style.zIndex = "99999";
    },
  });
};

export const errorAlert: (text: string) => Promise<void> = async (
  text: string,
) => {
  Swal.fire({
    text,
    icon: "error",
    confirmButtonText: "OK",
    showConfirmButton: true,
    didOpen: () => {
      const container = Swal.getContainer()!;
      container.style.zIndex = "99999";
    },
  });
};

export const warningAlert: (text: string) => Promise<void> = async (
  text: string,
) => {
  Swal.fire({
    text,
    icon: "warning",
    confirmButtonText: "OK",
    showConfirmButton: true,
    didOpen: () => {
      const container = Swal.getContainer()!;
      container.style.zIndex = "99999";
    },
  });
};
