/**
 * 该文件可能会以字符串形式直接输出到产物中
 * 因此不能引用外部模块，会因找不到外部模块报错
 */
interface DataObject {
    [key: string]: any
}

interface Computed {
    [k: string]: (this: { data: SanSSRData }) => any
}

/**
 * SSR 期间的 Data 实现，替代 import('san').SanSSRData
 *
 * * 不涉及视图更新
 * * 便于编译期优化
 */
export class SanSSRData {
    data: DataObject
    computed: Computed

    constructor (data: DataObject, instance: any) {
        this.data = data
        this.computed = instance.computed || {}
    }

    get (path: string): any {
        if (arguments.length === 0) return this.data
        if (this.computed[path]) return this.computed[path].call({ data: this })
        return this.parseExpr(path).reduce(
            (val: any, name: string) => val == null ? val : val[name],
            this.data
        )
    }

    set (path: string, value: string) {
        const seq = this.parseExpr(path)
        let parent = this.data
        for (let i = 0; i < seq.length - 1; i++) {
            const name = seq[i]
            if (parent[name]) {
                parent = parent[name]
            } else {
                return null
            }
        }
        parent[seq.pop()!] = value
        return value
    }

    removeAt (path: string, index: number) {
        const value: any[] = this.get(path)
        if (value && value.splice) value.splice(index, 1)
    }

    parseExpr (expr: string): string[] {
        return expr.split('.')
    }
}
