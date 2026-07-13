import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Pressable,
    Animated,
} from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/index';

export default function ConfirmModal({
    visible,
    onCancel,
    onConfirm,
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    emoji = '😢',
    destructive = true,
}) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            scaleAnim.setValue(0);
            rotateAnim.setValue(0);

            Animated.sequence([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    tension: 60,
                    useNativeDriver: true,
                }),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(rotateAnim, {
                            toValue: 1,
                            duration: 180,
                            useNativeDriver: true,
                        }),
                        Animated.timing(rotateAnim, {
                            toValue: -1,
                            duration: 360,
                            useNativeDriver: true,
                        }),
                        Animated.timing(rotateAnim, {
                            toValue: 0,
                            duration: 180,
                            useNativeDriver: true,
                        }),
                    ]),
                    { iterations: 2 },
                ),
            ]).start();
        }
    }, [visible]);

    const rotate = rotateAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-15deg', '0deg', '15deg'],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <Pressable style={styles.overlay} onPress={onCancel}>
                <Pressable style={styles.card} onPress={() => {}}>
                    <View
                        style={[
                            styles.iconCircle,
                            { backgroundColor: destructive ? '#FEE2E2' : '#EEF2FF' },
                        ]}
                    >
                        <Animated.Text
                            style={[
                                styles.emoji,
                                {
                                    transform: [
                                        { scale: scaleAnim },
                                        { rotate },
                                    ],
                                },
                            ]}
                        >
                            {emoji}
                        </Animated.Text>
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    {!!message && <Text style={styles.message}>{message}</Text>}

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelText}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                destructive ? styles.destructiveButton : styles.confirmButton,
                            ]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)', // darkBackground w/ opacity
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxl,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    emoji: {
        fontSize: 32,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.black,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    message: {
        fontSize: FontSizes.md,
        color: Colors.darkGrey,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        width: '100%',
        gap: Spacing.md,
    },
    button: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
    },
    cancelText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.darkGrey,
    },
    destructiveButton: {
        backgroundColor: Colors.error,
    },
    confirmButton: {
        backgroundColor: Colors.primary,
    },
    confirmText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.white,
    },
});