import React from 'react'
import renderer from 'react-test-renderer'

import QuestionBank from '../../../../ObojoboDraft/Chunks/QuestionBank/viewer-component'
import OboModel from '../../../../__mocks__/_obo-model-with-chunks'

describe('QuestionBank', () => {
	test('QuestionBank component', () => {
		const model = OboModel.create({
			id: 'id',
			type: 'ObojoboDraft.Chunks.QuestionBank',
			children: [
				{
					id: 'child-id',
					type: 'ObojoboDraft.Chunks.QuestionBank'
				}
			]
		})

		const moduleData = {
			focusState: {}
		}

		const component = renderer.create(<QuestionBank model={model} moduleData={moduleData} />)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})
})
