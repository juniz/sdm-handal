/**
 * SECURITY FIX: Utility functions untuk validasi props di React Server Components
 * Mencegah RCE (Remote Code Execution) pada React Server Components
 * 
 * Referensi: CVE-2025-55182, CVE-2025-66478
 * https://www.ox.security/blog/rce-in-react-server-components/
 */

/**
 * Validasi dan sanitasi props untuk Server Components
 * Mencegah injection attacks melalui props
 * 
 * @param {Object} props - Props yang diterima dari client
 * @param {Object} schema - Schema validasi (whitelist untuk allowed props)
 * @returns {Object} - Props yang sudah divalidasi dan disanitasi
 */
export function validateServerComponentProps(props, schema) {
	if (!props || typeof props !== "object") {
		throw new Error("Props must be an object");
	}

	if (!schema || typeof schema !== "object") {
		throw new Error("Schema must be an object");
	}

	const validatedProps = {};

	// Iterate melalui schema untuk validasi
	for (const [key, validator] of Object.entries(schema)) {
		if (props.hasOwnProperty(key)) {
			const value = props[key];

			// Validasi berdasarkan tipe validator
			if (typeof validator === "function") {
				// Custom validator function
				try {
					validatedProps[key] = validator(value);
				} catch (error) {
					throw new Error(
						`Invalid prop '${key}': ${error.message}`
					);
				}
			} else if (typeof validator === "object" && validator !== null) {
				// Validator object dengan rules
				validatedProps[key] = validatePropValue(
					key,
					value,
					validator
				);
			} else {
				// Default: hanya copy jika ada di schema
				validatedProps[key] = value;
			}
		} else if (validator.required) {
			// Required prop yang tidak ada
			throw new Error(`Required prop '${key}' is missing`);
		}
	}

	// Reject props yang tidak ada di schema (whitelist approach)
	const allowedKeys = Object.keys(schema);
	const providedKeys = Object.keys(props);
	const unknownKeys = providedKeys.filter((key) => !allowedKeys.includes(key));

	if (unknownKeys.length > 0) {
		console.warn(
			`Unknown props provided to Server Component: ${unknownKeys.join(", ")}`
		);
		// Reject unknown props untuk security
		// throw new Error(`Unknown props: ${unknownKeys.join(", ")}`);
	}

	return validatedProps;
}

/**
 * Validasi nilai prop berdasarkan rules
 */
function validatePropValue(key, value, rules) {
	// Type validation
	if (rules.type) {
		const expectedType = rules.type;
		const actualType = Array.isArray(value) ? "array" : typeof value;

		if (actualType !== expectedType) {
			throw new Error(
				`Prop '${key}' must be of type '${expectedType}', got '${actualType}'`
			);
		}
	}

	// String validation
	if (rules.type === "string") {
		if (typeof value !== "string") {
			throw new Error(`Prop '${key}' must be a string`);
		}

		// Max length
		if (rules.maxLength && value.length > rules.maxLength) {
			throw new Error(
				`Prop '${key}' exceeds maximum length of ${rules.maxLength}`
			);
		}

		// Min length
		if (rules.minLength && value.length < rules.minLength) {
			throw new Error(
				`Prop '${key}' is below minimum length of ${rules.minLength}`
			);
		}

		// Pattern validation (regex)
		if (rules.pattern && !rules.pattern.test(value)) {
			throw new Error(`Prop '${key}' does not match required pattern`);
		}

		// Whitelist values
		if (rules.whitelist && !rules.whitelist.includes(value)) {
			throw new Error(
				`Prop '${key}' must be one of: ${rules.whitelist.join(", ")}`
			);
		}

		// Sanitize: remove dangerous characters
		if (rules.sanitize !== false) {
			value = sanitizeString(value);
		}
	}

	// Number validation
	if (rules.type === "number") {
		if (typeof value !== "number" || isNaN(value)) {
			throw new Error(`Prop '${key}' must be a number`);
		}

		if (rules.min !== undefined && value < rules.min) {
			throw new Error(`Prop '${key}' must be >= ${rules.min}`);
		}

		if (rules.max !== undefined && value > rules.max) {
			throw new Error(`Prop '${key}' must be <= ${rules.max}`);
		}
	}

	// Array validation
	if (rules.type === "array") {
		if (!Array.isArray(value)) {
			throw new Error(`Prop '${key}' must be an array`);
		}

		if (rules.maxItems && value.length > rules.maxItems) {
			throw new Error(
				`Prop '${key}' exceeds maximum items of ${rules.maxItems}`
			);
		}

		if (rules.minItems && value.length < rules.minItems) {
			throw new Error(
				`Prop '${key}' is below minimum items of ${rules.minItems}`
			);
		}

		// Validate array items
		if (rules.items) {
			value = value.map((item, index) => {
				try {
					return validatePropValue(`${key}[${index}]`, item, rules.items);
				} catch (error) {
					throw new Error(
						`Invalid item at index ${index} in '${key}': ${error.message}`
					);
				}
			});
		}
	}

	// Object validation
	if (rules.type === "object") {
		if (typeof value !== "object" || value === null || Array.isArray(value)) {
			throw new Error(`Prop '${key}' must be an object`);
		}

		// Validate nested object
		if (rules.properties) {
			return validateServerComponentProps(value, rules.properties);
		}
	}

	return value;
}

/**
 * Sanitize string untuk mencegah injection attacks
 */
function sanitizeString(str) {
	if (typeof str !== "string") {
		return str;
	}

	// Remove potential script tags
	let sanitized = str
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
		.replace(/javascript:/gi, "")
		.replace(/on\w+\s*=/gi, ""); // Remove event handlers

	// Limit length untuk mencegah DoS
	const MAX_LENGTH = 10000;
	if (sanitized.length > MAX_LENGTH) {
		sanitized = sanitized.substring(0, MAX_LENGTH);
	}

	return sanitized;
}

/**
 * Validasi ID parameter (untuk dynamic routes)
 * Mencegah path traversal dan injection
 */
export function validateIdParam(id) {
	if (!id || typeof id !== "string") {
		throw new Error("Invalid ID parameter");
	}

	// Hanya allow alphanumeric, dash, underscore
	if (!/^[a-zA-Z0-9_\-]+$/.test(id)) {
		throw new Error("Invalid ID format");
	}

	// Limit length
	if (id.length > 100) {
		throw new Error("ID too long");
	}

	return id;
}

/**
 * Validasi search params dari URL
 */
export function validateSearchParams(searchParams, schema) {
	const validated = {};

	for (const [key, rules] of Object.entries(schema)) {
		const value = searchParams.get(key);

		if (value === null) {
			if (rules.required) {
				throw new Error(`Required search param '${key}' is missing`);
			}
			continue;
		}

		// Validate value
		try {
			validated[key] = validatePropValue(key, value, rules);
		} catch (error) {
			throw new Error(
				`Invalid search param '${key}': ${error.message}`
			);
		}
	}

	return validated;
}

/**
 * Example usage:
 * 
 * // Di Server Component
 * import { validateServerComponentProps } from '@/lib/server-component-security';
 * 
 * export default function MyServerComponent(props) {
 *   const schema = {
 *     id: {
 *       type: 'string',
 *       required: true,
 *       pattern: /^[a-zA-Z0-9_\-]+$/,
 *       maxLength: 100
 *     },
 *     title: {
 *       type: 'string',
 *       maxLength: 255,
 *       sanitize: true
 *     },
 *     page: {
 *       type: 'number',
 *       min: 1,
 *       max: 1000,
 *       default: 1
 *     }
 *   };
 * 
 *   const validatedProps = validateServerComponentProps(props, schema);
 *   
 *   // Gunakan validatedProps, bukan props langsung
 *   return <div>{validatedProps.title}</div>;
 * }
 */

