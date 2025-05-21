import { InferringContext, inferFromExpression } from '../inferFromExpression'

test('Infer from expression: Infer integer literals', async () => {
	const inferCtx = {} as InferringContext
	const type = await inferFromExpression('1', inferCtx)
	expect(type?.repr).toEqual('int')
})

test('Infer from expression: Infer integer literals underscored', async () => {
	const inferCtx = {} as InferringContext
	const type = await inferFromExpression('1_000_000', inferCtx)
	expect(type?.repr).toEqual('int')
})

test('Infer from expression: Infer float literals', async () => {
	const inferCtx = {} as InferringContext
	const type = await inferFromExpression('1.23', inferCtx)
	expect(type?.repr).toEqual('float')
})

test('Infer from expression: Infer float literals underscored', async () => {
	const inferCtx = {} as InferringContext
	const type = await inferFromExpression('1.2_3_4', inferCtx)
	expect(type?.repr).toEqual('float')
})

test('Infer from expression: Infer string literals', async () => {
	const inferCtx = {} as InferringContext
	const type = await inferFromExpression('"yay"', inferCtx)
	expect(type?.repr).toEqual('string')
})

test('Infer from expression: Infer string literals', async () => {
	const inferCtx = {} as InferringContext
	const type = await inferFromExpression('"yay {$lol}"', inferCtx)
	expect(type?.repr).toEqual('string')
})
