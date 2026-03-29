import { SetMetadata } from '@nestjs/common';

export const IS_HARDWARE_MANAGEMENT_KEY = 'isHardwareManagement';
export const HardwareManagement = () => SetMetadata(IS_HARDWARE_MANAGEMENT_KEY, true);
