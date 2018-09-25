import React from 'react'

import { Block } from 'slate'
import { CHILD_REQUIRED, CHILD_TYPE_INVALID } from 'slate-schema-violations'

const TABLE_NODE = 'ObojoboDraft.Chunks.Table'

const TABLE_ROW_NODE = 'ObojoboDraft.Chunks.Table.Row'
const TABLE_CELL_NODE = 'ObojoboDraft.Chunks.Table.Cell'

const Cell = props => {
	if (props.node.data.get('content').header) {
		return <th {...props.attributes}>{props.children}</th>
	}
	return <td {...props.attributes}>{props.children}</td>
}

class Row extends React.Component {
	deleteRow() {
		const editor = this.props.editor
		const change = editor.value.change()

		const parent = editor.value.document.getDescendant(this.props.parent.key)
		const content = parent.data.get('content')
		content.textGroup.numRows--

		if (parent.nodes.get(0).key === this.props.node.key) {
			const sibling = parent.nodes.get(1)

			// If this is the only row in the table, delete the table
			if (!sibling) {
				change.removeNodeByKey(parent.key)
				editor.onChange(change)
				return
			}

			sibling.nodes.forEach(cell => {
				change.setNodeByKey(cell.key, { data: { content: { header: content.header } } })
			})
			change.setNodeByKey(sibling.key, { data: { content: { header: content.header } } })
		}

		change.removeNodeByKey(this.props.node.key)

		editor.onChange(change)
	}

	render() {
		return (
			<tr {...this.props.attributes}>
				{this.props.children}
				<td className={'delete-cell'}>
					<button onClick={() => this.deleteRow()}>{'X'}</button>
				</td>
			</tr>
		)
	}
}

class Node extends React.Component {
	constructor(props) {
		super(props)
		this.state = props.node.data.get('content')
	}

	addRow() {
		this.state.textGroup.numRows++
		const editor = this.props.editor
		const change = editor.value.change()

		const newRow = Block.create({
			type: TABLE_ROW_NODE,
			data: { content: { header: false } }
		})

		change.insertNodeByKey(this.props.node.key, this.state.textGroup.numRows - 1, newRow)

		// Insert the cells for the new row, minus the cell that was inserted by normalization
		for (let i = 0; i < this.state.textGroup.numCols - 1; i++) {
			change.insertNodeByKey(
				newRow.key,
				i,
				Block.create({
					type: TABLE_CELL_NODE,
					data: { content: { header: false } }
				})
			)
		}

		editor.onChange(change)
	}

	addCol() {
		this.state.textGroup.numCols++
		const editor = this.props.editor
		const change = editor.value.change()

		this.props.node.nodes.forEach(row => {
			const header = row.data.get('content').header
			change.insertNodeByKey(
				row.key,
				this.state.textGroup.numCols - 1,
				Block.create({
					type: TABLE_CELL_NODE,
					data: { content: { header } }
				})
			)
		})

		editor.onChange(change)
	}

	deleteCol(index) {
		this.state.textGroup.numCols--

		const editor = this.props.editor
		const change = editor.value.change()

		this.props.node.nodes.forEach(row => {
			const cell = row.nodes.get(index)

			change.removeNodeByKey(cell.key)
		})

		editor.onChange(change)
	}

	renderColDelete() {
		const buttons = new Array(this.state.textGroup.numCols)
		buttons.fill('X')

		return (
			<tr>
				{buttons.map((col, index) => {
					return (
						<td key={index} className={'delete-cell'}>
							<button onClick={() => this.deleteCol(index)}>{col}</button>
						</td>
					)
				})}
			</tr>
		)
	}

	toggleHeader() {
		const editor = this.props.editor
		const change = editor.value.change()

		// toggle the header flag for the table
		this.state.header = !this.state.header

		const topRow = this.props.node.nodes.get(0)

		// change the header flag on the top row
		change.setNodeByKey(topRow.key, { data: { content: { header: this.state.header } } })

		// change the header flag on each cell of the top row
		topRow.nodes.forEach(cell => {
			change.setNodeByKey(cell.key, { data: { content: { header: this.state.header } } })
		})

		editor.onChange(change)
	}

	render() {
		return (
			<div className={'component'} {...this.props.attributes}>
				<div className={'obojobo-draft--chunks--table viewer pad'}>
					<div className={'container'}>
						<table className="view" key="table">
							<tbody>
								{this.props.children}
								{this.renderColDelete()}
							</tbody>
						</table>
					</div>
				</div>
				<div className={'table-editor'}>
					<button onClick={() => this.addRow()}>{'Add Row'}</button>
					<button onClick={() => this.addCol()}>{'Add Column'}</button>
					<button onClick={() => this.toggleHeader()}>{'Toggle Header'}</button>
				</div>
			</div>
		)
	}
}

const isType = change => {
	return change.value.blocks.some(block => {
		return !!change.value.document.getClosest(block.key, parent => {
			return parent.type === TABLE_NODE
		})
	})
}

const insertNode = change => {
	change
		.insertBlock({
			type: TABLE_NODE,
			data: { content: { header: true, textGroup: { numRows: 1, numCols: 1 } } }
		})
		.collapseToStartOfNextText()
		.focus()
}

const slateToObo = node => {
	const json = {}
	json.id = node.key
	json.type = node.type
	json.content = node.data.get('content') || { textGroup: {} }
	json.content.textGroup.textGroup = []

	node.nodes.forEach(row => {
		row.nodes.forEach(cell => {
			const codeLine = {
				text: { value: cell.text, styleList: [] }
			}

			let currIndex = 0

			cell.nodes.forEach(text => {
				text.leaves.forEach(textRange => {
					textRange.marks.forEach(mark => {
						const style = {
							start: currIndex,
							end: currIndex + textRange.text.length,
							type: mark.type,
							data: JSON.parse(JSON.stringify(mark.data))
						}
						codeLine.text.styleList.push(style)
					})
					currIndex += textRange.text.length
				})
			})

			json.content.textGroup.textGroup.push(codeLine)
		})
	})
	json.children = []

	return json
}

const oboToSlate = node => {
	const json = {}
	json.object = 'block'
	json.key = node.id
	json.type = node.type
	json.data = { content: node.content }

	json.nodes = []
	const cols = node.content.textGroup.numCols
	const hasHeader = node.content.header
	let currRow

	node.content.textGroup.textGroup.forEach((line, index) => {
		if (index % cols === 0) {
			currRow = {
				object: 'block',
				type: TABLE_ROW_NODE,
				data: { content: { header: hasHeader && json.nodes.length === 0 } },
				nodes: []
			}
			json.nodes.push(currRow)
		}

		const tableCell = {
			object: 'block',
			type: TABLE_CELL_NODE,
			data: { content: { header: hasHeader && index < cols } },
			nodes: [
				{
					object: 'text',
					leaves: [
						{
							text: line.text.value
						}
					]
				}
			]
		}

		currRow.nodes.push(tableCell)
	})

	return json
}

const plugins = {
	onKeyDown(event, change) {
		// See if any of the selected nodes have a CODE_NODE parent
		const isTable = isType(change)
		if (!isTable) return

		// Disallow enter in tables
		if (event.key === 'Enter') {
			event.preventDefault()
			return false
		}

		if (isTable && (event.key === 'Backspace' || event.key === 'Delete')) {
			const value = change.value
			const startBlock = value.startBlock
			const startOffset = value.startOffset
			const isCollapsed = value.isCollapsed
			const endBlock = value.endBlock

			// If a cursor is collapsed at the start of the first block, do nothing
			if (startOffset === 0 && isCollapsed) {
				event.preventDefault()
				return change
			}

			// Deletion within a cell
			if (startBlock === endBlock) {
				return
			}

			// Deletion across cells
			event.preventDefault()
			const blocks = value.blocks

			// Get all cells that contains the selection
			const cells = blocks.toSet()

			const ignoreFirstCell = value.selection.collapseToStart().isAtEndOf(cells.first())
			const ignoreLastCell = value.selection.collapseToEnd().isAtStartOf(cells.last())

			let cellsToClear = cells
			if (ignoreFirstCell) {
				cellsToClear = cellsToClear.rest()
			}
			if (ignoreLastCell) {
				cellsToClear = cellsToClear.butLast()
			}

			// Clear all the selection
			cellsToClear.forEach(cell => {
				cell.nodes.forEach(node => {
					change.removeNodeByKey(node.key)
				})
			})

			return true
		}
	},
	renderNode(props) {
		switch (props.node.type) {
			case TABLE_NODE:
				return <Node {...props} />
			case TABLE_ROW_NODE:
				return <Row {...props} />
			case TABLE_CELL_NODE:
				return <Cell {...props} />
		}
	},
	schema: {
		blocks: {
			'ObojoboDraft.Chunks.Table': {
				nodes: [{ types: [TABLE_ROW_NODE], min: 1 }],
				normalize: (change, violation, { node, child, index }) => {
					const header = index === 0 && node.data.get('content').header
					switch (violation) {
						case CHILD_TYPE_INVALID: {
							// Allow inserting of new nodes by unwrapping unexpected blocks at end
							if (child.object === 'block' && index === node.nodes.size - 1) {
								return change.unwrapNodeByKey(child.key)
							}

							// If a block was inserted in the middle, delete it to maintain table shape
							if (child.object === 'block') {
								return change.removeNodeByKey(child.key)
							}

							return change.wrapBlockByKey(child.key, {
								type: TABLE_ROW_NODE,
								data: { content: { header } }
							})
						}
						case CHILD_REQUIRED: {
							const block = Block.create({
								type: TABLE_ROW_NODE,
								data: { content: { header } }
							})
							return change.insertNodeByKey(node.key, index, block)
						}
					}
				}
			},
			'ObojoboDraft.Chunks.Table.Row': {
				nodes: [{ types: [TABLE_CELL_NODE], min: 1 }],
				normalize: (change, violation, { node, child, index }) => {
					const header = node.data.get('content').header
					switch (violation) {
						case CHILD_TYPE_INVALID: {
							// Allow inserting of new nodes by unwrapping unexpected blocks at end
							if (child.object === 'block' && index === node.nodes.size - 1) {
								return change.unwrapNodeByKey(child.key)
							}

							// If a block was inserted in the middle, delete it to maintain table shape
							if (child.object === 'block') {
								return change.removeNodeByKey(child.key)
							}

							return change.wrapBlockByKey(child.key, {
								type: TABLE_CELL_NODE,
								data: { content: { header } }
							})
						}
						case CHILD_REQUIRED: {
							const block = Block.create({
								type: TABLE_CELL_NODE,
								data: { content: { header } }
							})
							return change.insertNodeByKey(node.key, index, block)
						}
					}
				}
			},
			'ObojoboDraft.Chunks.Table.Cell': {
				nodes: [{ objects: ['text'] }],
				normalize: (change, violation, { node, child, index }) => {
					switch (violation) {
						case CHILD_TYPE_INVALID: {
							// Allow inserting of new nodes by unwrapping unexpected blocks at end
							if (child.object === 'block' && index === node.nodes.size - 1) {
								return change.unwrapNodeByKey(child.key)
							}
						}
					}
				}
			}
		}
	}
}

const Table = {
	components: {
		Node,
		Row,
		Cell
	},
	helpers: {
		insertNode,
		slateToObo,
		oboToSlate
	},
	plugins
}

export default Table
