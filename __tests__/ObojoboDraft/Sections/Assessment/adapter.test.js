import AssessmentAdapter from 'ObojoboDraft/Sections/Assessment/adapter'

describe('ObojoboDraft.Sections.Assessment adapter', () => {
	test('construct builds without attributes', () => {
		const model = { modelState: {} }
		AssessmentAdapter.construct(model)
		expect(model.modelState).toMatchSnapshot()
	})

	test('construct builds with N attempts', () => {
		const model = { modelState: {} }
		AssessmentAdapter.construct(model, { content: { attempts: 6 } })
		expect(model.modelState).toMatchSnapshot()
		expect(model.modelState.attempts).toBe(6)
	})

	test('construct builds with unlimited attempts', () => {
		const model = { modelState: {} }
		AssessmentAdapter.construct(model, { content: { attempts: 'unlimited' } })
		expect(model.modelState).toMatchSnapshot()
		expect(model.modelState.attempts).toBe(Infinity)
	})

	test('construct floors decimal attempt integers', () => {
		const model = { modelState: {} }
		AssessmentAdapter.construct(model, { content: { attempts: 6.9 } })
		expect(model.modelState).toMatchSnapshot()
		expect(model.modelState.attempts).toBe(6)
	})

	test('construct builds with legacy score actions', () => {
		const model = { modelState: {} }

		// use the legacy action syntax
		const action = {
			from: 2,
			to: 4,
			page: 5
		}
		AssessmentAdapter.construct(model, { content: { scoreActions: [action] } })
		expect(model.modelState).toMatchObject({
			attempts: Infinity,
			scoreActions: {
				actions: [
					{
						page: 5,
						range: {
							isMaxInclusive: true,
							isMinInclusive: true,
							max: '4',
							min: '2'
						}
					}
				],
				originalActions: [action]
			}
		})
	})

	test('construct builds with score actions', () => {
		const model = { modelState: {} }
		const action = {
			for: '[2,4]',
			page: 5
		}
		AssessmentAdapter.construct(model, { content: { scoreActions: [action] } })
		expect(model.modelState).toMatchObject({
			attempts: Infinity,
			scoreActions: {
				actions: [
					{
						page: 5,
						range: {
							isMaxInclusive: true,
							isMinInclusive: true,
							max: '4',
							min: '2'
						}
					}
				],
				originalActions: [action]
			}
		})
	})

	test('clone creates a copy', () => {
		const model = { modelState: {} }
		const model2 = { modelState: {} }
		const action = {
			for: '[2,4]',
			page: 5
		}
		AssessmentAdapter.construct(model, { content: { scoreActions: [action] } })
		expect(model.modelState).toMatchObject({
			attempts: Infinity,
			scoreActions: {
				actions: [
					{
						page: 5,
						range: {
							isMaxInclusive: true,
							isMinInclusive: true,
							max: '4',
							min: '2'
						}
					}
				],
				originalActions: [action]
			}
		})

		AssessmentAdapter.clone(model, model2)

		expect(model).not.toBe(model2)
		expect(model.modelState).not.toBe(model2.modelState)
		expect(model.modelState).toMatchObject(model2.modelState)
	})

	test('toJSON builds a JSON representation', () => {
		const model = { modelState: {} }
		const action = {
			for: '[2,4]',
			page: 5
		}
		AssessmentAdapter.construct(model, { content: { scoreActions: [action] } })
		expect(model.modelState).toMatchObject({
			attempts: Infinity,
			scoreActions: {
				actions: [
					{
						page: 5,
						range: {
							isMaxInclusive: true,
							isMinInclusive: true,
							max: '4',
							min: '2'
						}
					}
				],
				originalActions: [action]
			}
		})

		const json = { content: {} }
		AssessmentAdapter.toJSON(model, json)

		expect(json).toMatchObject({
			content: {
				attempts: Infinity,
				scoreActions: [
					{
						for: '[2,4]',
						page: 5
					}
				]
			}
		})
	})
})
