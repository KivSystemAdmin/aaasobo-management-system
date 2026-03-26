import Swal from "sweetalert2";

const buildAlertHtml = (text: string): string => `
  <div style="text-align:center;">
    <div style="display:inline-block; text-align:left; margin:0 auto; max-width: 100%; width: fit-content; white-space: normal; overflow-wrap: break-word;">
      ${text}
    </div>
  </div>
`;

export const confirmAlert: (text: string) => Promise<boolean> = (
  text: string,
) => {
  const result = Swal.fire({
    html: buildAlertHtml(text),
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
    html: buildAlertHtml(text),
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
    html: buildAlertHtml(text),
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
    html: buildAlertHtml(text),
    icon: "warning",
    confirmButtonText: "OK",
    showConfirmButton: true,
    didOpen: () => {
      const container = Swal.getContainer()!;
      container.style.zIndex = "99999";
    },
  });
};
