/**
 * AddInseminationModal.tsx — Export Alias for RegisterBreedingServiceModal
 */
import { RegisterBreedingServiceModal } from "./RegisterBreedingServiceModal";

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedMareId?: string;
  onNavigateView?: (view: string) => void;
}

export function AddInseminationModal({ open, onClose, preselectedMareId, onNavigateView }: Props) {
  return (
    <RegisterBreedingServiceModal
      open={open}
      onClose={onClose}
      preselectedMareId={preselectedMareId}
      onNavigateView={onNavigateView}
    />
  );
}
