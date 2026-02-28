import * as LocalAuth from "expo-local-authentication";

export const authenticateUser = async() => {
    const hasHardware = await LocalAuth.hasHardwareAsync();
    const securityLevel = await LocalAuth.getEnrolledLevelAsync();
    if ( !hasHardware || securityLevel === LocalAuth.SecurityLevel.NONE ){
        return {success: false, error: 'No security enrolled'};
    }

    return await LocalAuth.authenticateAsync({
        promptMessage: 'Verify Identify',
        biometricsSecurityLevel: 'weak',
        requireConfirmation: false
    });
};