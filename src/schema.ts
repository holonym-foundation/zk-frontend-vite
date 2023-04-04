import { z } from "zod";

const derivedCredsValueSchema = z.object({
	derivationFunction: z.string(),
	inputFields: z.array(z.string()),
	value: z.string(),
});

const pointSchema = z.object({
	x: z.string(),
	y: z.string(),
});

export const issuerAddressSchema = z.string().startsWith("0x").length(132);

export const CredsSchema = z.object({
	customFields: z.array(z.string()),
	iat: z.string(),
	issuerAddress: issuerAddressSchema,
	scope: z.string(),
	secret: z.string(),
	serializedAsPreimage: z.array(z.string()),
});

export const idServerGetCredentialsRespnseSchema = z.object({
	creds: CredsSchema,
	leaf: z.string(),
	metadata: z.object({
		derivedCreds: z.object({
			addressHash: derivedCredsValueSchema,
			nameDobCitySubdivisionZipStreetExpireHash: derivedCredsValueSchema,
			nameHash: derivedCredsValueSchema,
			streetHash: derivedCredsValueSchema,
		}),
		fieldsInLeaf: z.array(z.string()),
		rawCreds: z.object({
			birthdate: z.string(),
			city: z.string(),
			completedAt: z.string(),
			countryCode: z.number(),
			expirationDate: z.string(),
			firstName: z.string(),
			lastName: z.string(),
			middleName: z.string(),
			streetName: z.string(),
			streetNumber: z.number(),
			streetUnit: z.string(),
			subdivision: z.string(),
			zipCode: z.number(),
		}),
	}),
	pubkey: pointSchema,
	signature: z.object({
		R8: pointSchema,
		S: z.string(),
	}),
});
