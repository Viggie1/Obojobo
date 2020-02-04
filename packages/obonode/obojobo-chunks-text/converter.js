import { Block } from 'slate'

import TextUtil from 'obojobo-document-engine/src/scripts/oboeditor/util/text-util'
import withoutUndefined from 'obojobo-document-engine/src/scripts/common/util/without-undefined'

const TEXT_NODE = 'ObojoboDraft.Chunks.Text'
const TEXT_LINE_NODE = 'ObojoboDraft.Chunks.Text.TextLine'
const HEADING_NODE = 'ObojoboDraft.Chunks.Heading'
const LIST_NODE = 'ObojoboDraft.Chunks.List'
const LIST_LEVEL_NODE = 'ObojoboDraft.Chunks.List.Level'
const CODE_NODE = 'ObojoboDraft.Chunks.Code'
const CODE_LINE_NODE = 'ObojoboDraft.Chunks.Code.CodeLine'

const unorderedBullets = ['disc', 'circle', 'square']
const orderedBullets = ['decimal', 'lower-alpha', 'lower-roman', 'upper-alpha', 'upper-roman']

/**
 * Generates an Obojobo Text Node from a Slate node.
 * Copies the id, type, triggers, and condenses TextLine children and their 
 * text children (including marks) into a single textGroup
 * @param {Object} node A Slate Node
 * @returns {Object} An Obojobo Text node 
 */
const slateToObo = node => {
	const textGroup = node.children.map(line => {
		const textLine = {
			text: { value: "", styleList: [] },
			data: { indent: line.content.indent, align: line.content.align }
		}

		TextUtil.slateToOboText(line, textLine)

		return textLine
	})

	return {
		id: node.id,
		type: node.type,
		children: [],
		content: withoutUndefined({
			triggers: node.content.triggers,
			textGroup
		})
	}
}

/**
 * Generates a Slate node from an Obojobo Text node.
 * Copies all attributes, and converts a textGroup into Slate Text children
 * Each textItem in the textgroup becomes a separate TextLine node in order
 * to properly leverage the Slate Editor's capabilities
 * @param {Object} node An Obojobo Text node 
 * @returns {Object} A Slate node
 */
const oboToSlate = node => {
	const slateNode = Object.assign({}, node)
	slateNode.children = node.content.textGroup.map(line => {
		const indent = line.data ? line.data.indent : 0
		const align = line.data ? line.data.align : 'left'
		return {
			type: TEXT_NODE,
			subtype: TEXT_LINE_NODE,
			content: { indent, align },
			children: TextUtil.parseMarkings(line)
		}
	})

	return slateNode
}

// Provides a single node with recursively nested parent levels with appropriate bullets
const unFlattenList = (jsonNode, diff, type, bulletList, bulletIndex) => {
	if(diff === 0) return jsonNode

	// The parent bullet style is the style before the current style
	const bulletStyle = bulletList[(bulletIndex + diff - 1) % bulletList.length]

	return unFlattenList({
		object: 'block',
		type: LIST_LEVEL_NODE,
		nodes: [jsonNode],
		data: { content: { type,  bulletStyle }}
	}, diff - 1, type, bulletList, bulletIndex)
}

const switchType = {
	'ObojoboDraft.Chunks.Heading': (editor, node, data) => {
		node
			.getLeafBlocksAtRange(editor.value.selection)
			.forEach(child => editor.setNodeByKey(
				child.key, 
				{ type: HEADING_NODE, data: { content: { ...child.data.toJSON(), ...data } }}
			))
	},
	'ObojoboDraft.Chunks.Code': (editor, node) => {
		const textNode = {
			type: CODE_NODE,
			nodes: []
		}
		const leaves = node.getLeafBlocksAtRange(editor.value.selection)

		// Copy the selected Text Line nodes over to the new code Node, 
		// then remove every node except for the first, 
		// as they will be rebuilt in the code node
		// The first node (unremoved) provides an anchor for replacement
		leaves.forEach((child, index) => {
			const jsonNode = child.toJSON()
			jsonNode.type = CODE_LINE_NODE
			jsonNode.data.content = jsonNode.data
			textNode.nodes.push(jsonNode)

			if(index !== 0) editor.removeNodeByKey(child.key)
		})

		// The code node replaces the first child node, with all the copied children,
		// including the copy of the first child
		const block = Block.create(textNode)
		editor.replaceNodeByKey(leaves.get(0).key, block).moveToRangeOfNode(block).focus()
	},
	'ObojoboDraft.Chunks.List': (editor, node, data) => {
		// Find the bullet list ind starting index for the selection
		const bulletList = data.type === 'unordered' ? unorderedBullets : orderedBullets
		const bulletIndex = bulletList.indexOf(data.bulletStyle)

		const textNode = {
			type: LIST_NODE,
			nodes: [],
			data: { content: { listStyles: { type: data.type }}}
		}
		const leaves = node.getLeafBlocksAtRange(editor.value.selection)

		const topIndent = leaves.reduce((accum, child) => {
			const jsonNode = child.toJSON()
			if (jsonNode.data.indent < accum) return jsonNode.data.indent
			return accum
		}, 20)

		// Copy the selected Text Line nodes over to the new list Node,
		// then remove every node except for the first, 
		// as they will be rebuilt in the list node
		// The first node (unremoved) provides an anchor for replacement
		leaves.forEach((child, index) => {
			const jsonNode = child.toJSON()
			jsonNode.type = LIST_LEVEL_NODE

			// Use the topmost indent as the starting bullet style
			// then rotate through the bullet styles as the indents increase
			const indentDiff = jsonNode.data.indent - topIndent
			const bulletStyle = bulletList[(bulletIndex + indentDiff) % bulletList.length]
			jsonNode.data.content = { ...data, bulletStyle }
			textNode.nodes.push(unFlattenList(jsonNode, indentDiff, data.type, bulletList, bulletIndex))

			if(index !== 0) editor.removeNodeByKey(child.key)
		})

		// The list node replaces the first child node, with all the copied children,
		// including the copy of the first child
		const block = Block.create(textNode)
		editor.replaceNodeByKey(leaves.get(0).key, block).moveToRangeOfNode(block).focus()
	}
}

export default { slateToObo, oboToSlate, switchType }
