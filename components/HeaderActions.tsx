import React from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useHeader } from '@/contexts/HeaderContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function HeaderActions() {
    const { actions } = useHeader();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    if (!actions || actions.length === 0) return null;

    return (
        <View style={styles.container}>
            {actions.map((action) => (
                <TouchableOpacity
                    key={action.id}
                    onPress={action.onPress}
                    disabled={action.disabled || action.loading}
                    style={[styles.actionBtn, action.disabled && { opacity: 0.5 }]}
                >
                    {action.loading ? (
                        <ActivityIndicator size="small" color={action.color || colors.tint} />
                    ) : (
                        <FontAwesome
                            name={action.icon as any}
                            size={20}
                            color={action.color || (colorScheme === 'dark' ? '#fff' : '#000')}
                        />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    actionBtn: {
        padding: 8,
        marginLeft: 4,
    },
});
